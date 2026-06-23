from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import Organization
from apps.accounts.models import User
from .models import PaymentTransaction, Subscription
from .constants import PLAN_PRICES


class BillingAPITests(APITestCase):
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
        refresh = RefreshToken.for_user(self.user)
        self.access = str(refresh.access_token)

    def test_upgrade_success_json(self):
        url = reverse('upgrade-plan')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        data = {"plan": "PRO", "provider": "ESEWA"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transaction_id', response.data)
        tx = PaymentTransaction.objects.get(transaction_id=response.data['transaction_id'])
        self.assertEqual(tx.organization, self.org)

    def test_upgrade_invalid_plan(self):
        url = reverse('upgrade-plan')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        data = {"plan": "GOLD", "provider": "ESEWA"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_upgrade_success_form_encoded(self):
        url = reverse('upgrade-plan')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        # form-encoded (no format param)
        data = {"plan": "BASIC", "provider": "KHALTI"}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transaction_id', response.data)

    def test_esewa_missing_transaction_id(self):
        url = reverse('esewa-verify')
        response = self.client.post(url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_esewa_success_json(self):
        # create transaction
        tx = PaymentTransaction.objects.create(
            organization=self.org,
            plan='PRO',
            provider='ESEWA',
            amount=PLAN_PRICES['PRO'],
            transaction_id='test-tx-json'
        )
        url = reverse('esewa-verify')
        data = {
            "transaction_id": tx.transaction_id,
            "reference_id": "MOCK-json"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESS')
        # ensure subscription updated
        subscription = Subscription.objects.get(organization=self.org)
        self.assertEqual(subscription.plan, 'PRO')

    def test_esewa_success_form_encoded(self):
        tx = PaymentTransaction.objects.create(
            organization=self.org,
            plan='BASIC',
            provider='ESEWA',
            amount=PLAN_PRICES['BASIC'],
            transaction_id='test-tx-form'
        )
        url = reverse('esewa-verify')
        data = {
            "transaction_id": tx.transaction_id,
            "reference_id": "MOCK-form"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESS')

    def test_upgrade_lowercase_plan_provider(self):
        url = reverse('upgrade-plan')
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        data = {"plan": "pro", "provider": "esewa"}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transaction_id', response.data)

    def test_esewa_accept_txn_key(self):
        tx = PaymentTransaction.objects.create(
            organization=self.org,
            plan='BASIC',
            provider='ESEWA',
            amount=PLAN_PRICES['BASIC'],
            transaction_id='test-tx-key'
        )
        url = reverse('esewa-verify')
        # use alternate key 'txn' as some clients might
        response = self.client.post(url, {
            "txn": tx.transaction_id,
            "reference_id": "MOCK-key"
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'SUCCESS')

    def test_esewa_verification_deferred(self):
        """Test that network errors during verification don't mark payment as FAILED"""
        tx = PaymentTransaction.objects.create(
            organization=self.org,
            plan='BASIC',
            provider='ESEWA',
            amount=PLAN_PRICES['BASIC'],
            transaction_id="deferred-tx-id"
        )
        
        # We need to mock the ESewaPaymentManager.verify_payment to return a transient error
        from unittest.mock import patch
        with patch('apps.billing.views.ESewaPaymentManager.verify_payment') as mock_verify:
            mock_verify.return_value = {"ok": False, "message": "request error: connection timeout"}
            
            url = reverse('esewa-verify')
            response = self.client.post(url, {"transaction_id": tx.transaction_id})
            
            self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
            self.assertEqual(response.data['status'], 'PENDING')
            
            tx.refresh_from_db()
            self.assertEqual(tx.status, 'PENDING')

    def test_plan_limits_constant_values(self):
        """Ensure the invoice limits in constants match expected values."""
        from .constants import PLAN_LIMITS
        self.assertEqual(PLAN_LIMITS['FREE']['invoices'], 10)
        self.assertEqual(PLAN_LIMITS['BASIC']['invoices'], 1000)
        # PRO should be unlimited (None) for nicer UI handling
        self.assertIsNone(PLAN_LIMITS['PRO']['invoices'])
