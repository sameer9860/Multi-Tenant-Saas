from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import Organization
from apps.accounts.models import User
from .models import Invoice


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

    def test_create_invoice_with_token_sets_organization(self):
        refresh = RefreshToken.for_user(self.user)
        access = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

        data = {"customer_name": "ACME", "amount": "100.00"}
        response = self.client.post(reverse('invoice-list'), data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        invoice = Invoice.objects.get(id=response.data['id'])
        self.assertEqual(invoice.organization, self.org)

    def test_create_invoice_without_credentials_returns_401(self):
        data = {"customer_name": "NoAuth", "amount": "10.00"}
        response = self.client.post(reverse('invoice-list'), data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
