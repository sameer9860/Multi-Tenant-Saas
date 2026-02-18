from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import Organization
from apps.accounts.models import User
from .models import Invoice, Customer


class InvoiceAuthTests(APITestCase):
    def setUp(self):
        self.org = Organization.objects.create(
            name="Org",
            slug="org",
            email="org@example.com",
            phone="1234567890",
        )
        self.user = User.objects.create_user(
            email="user@example.com",
            full_name="User",
            organization=self.org,
            password="testpass123",
        )
        self.client = APIClient()

    def authenticate(self):
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    def test_create_customer_endpoint(self):
        # ensure customers can be created and organization is set automatically
        self.authenticate()
        payload = {"name": "Test Customer"}
        resp = self.client.post(reverse('customer-list'), payload, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], payload['name'])
        self.assertEqual(resp.data['organization'], self.org.id)

    def test_create_invoice_with_customer_id(self):
        # create a customer first
        self.authenticate()
        customer = Customer.objects.create(
            organization=self.org,
            name="ACME Corp",
        )
        data = {
            "customer_id": customer.id,
            "date": "2023-01-01",
            "subtotal": "100.00",
            "vat_amount": "13.00",
            "total": "113.00",
        }
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # invoice should belong to org and include nested customer
        invoice = Invoice.objects.get(id=response.data['id'])
        self.assertEqual(invoice.organization, self.org)
        self.assertEqual(invoice.customer, customer)
        # balance should default to total when no payment exists
        self.assertEqual(invoice.balance, invoice.total)
        # response should embed customer object
        self.assertIsInstance(response.data.get('customer'), dict)
        self.assertEqual(response.data['customer']['name'], customer.name)

        # also try sending with "customer" key instead of customer_id
        resp2 = self.client.post(reverse('invoice-list'), {"customer": customer.id, "date": "2023-01-02", "subtotal": "50.00", "vat_amount": "6.50", "total": "56.50"}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_201_CREATED)
        self.assertIsInstance(resp2.data.get('customer'), dict)
        self.assertEqual(resp2.data['customer']['id'], customer.id)

        # now try creating with partial paid amount
        resp3 = self.client.post(reverse('invoice-list'), {
            "customer_id": customer.id,
            "date": "2023-01-03",
            "subtotal": "100.00",
            "vat_amount": "13.00",
            "total": "113.00",
            "paid_amount": "30.00",
        }, format='json')
        self.assertEqual(resp3.status_code, status.HTTP_201_CREATED)
        inv3 = Invoice.objects.get(id=resp3.data['id'])
        self.assertEqual(inv3.paid_amount, 30)
        self.assertEqual(inv3.balance, inv3.total - 30)
        self.assertEqual(inv3.status, "PARTIAL")

        # full payment case
        resp4 = self.client.post(reverse('invoice-list'), {
            "customer_id": customer.id,
            "date": "2023-01-04",
            "subtotal": "200.00",
            "vat_amount": "26.00",
            "total": "226.00",
            "paid_amount": "226.00",
        }, format='json')
        self.assertEqual(resp4.status_code, status.HTTP_201_CREATED)
        inv4 = Invoice.objects.get(id=resp4.data['id'])
        self.assertEqual(inv4.status, "PAID")

    def test_invoice_list_includes_customer_object(self):
        # prepare a customer and invoice, then fetch list
        self.authenticate()
        cust = Customer.objects.create(organization=self.org, name="FooCo")
        Invoice.objects.create(
            organization=self.org,
            customer=cust,
            date="2023-01-02",
            due_date="2023-02-02",
            subtotal="200.00",
            vat_amount="26.00",
            total="226.00",
        )
        resp = self.client.get(reverse('invoice-list'))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        self.assertTrue(results)
        first = results[0]
        self.assertIn('customer', first)
        self.assertIsInstance(first['customer'], dict)
        self.assertEqual(first['customer']['name'], "FooCo")
        # list response should include balance field as well
        self.assertIn('balance', first)
        self.assertIn('paid_amount', first)
        # balance equals total when no payment yet
        self.assertEqual(str(first['balance']), "226.00")
        # paid_amount should default to 0
        self.assertEqual(str(first['paid_amount']), "0.00")

    def test_create_invoice_without_credentials_returns_401(self):
        data = {"customer_id": 999, "date": "2023-01-01", "subtotal": "10.00", "vat_amount": "1.30", "total": "11.30"}
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
