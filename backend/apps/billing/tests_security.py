"""Security regression tests for billing: payment bypass, cross-tenant IDOR."""
from django.urls import reverse
from django.test import override_settings
from rest_framework import status
from apps.core.test_helpers import BaseAPITestCase
from apps.billing.models import PaymentTransaction, Subscription
from apps.billing.constants import PLAN_PRICES


class PaymentBypassTests(BaseAPITestCase):

    def test_trial_user_cannot_upgrade_without_payment(self):
        """Trial users must go through payment — plan must NOT change for free."""
        sub, _ = Subscription.objects.get_or_create(organization=self.org)
        sub.is_trial = True
        sub.plan = "FREE"
        sub.save()

        url = reverse('upgrade_plan')  # subscriptions app endpoint
        resp = self.owner_client.post(url, {"plan": "PRO"}, format='json')

        # Must require payment — not silently upgrade
        self.assertIn(resp.status_code, [200, 202])
        if resp.status_code == 200:
            self.assertTrue(resp.data.get('requires_payment'), "Trial upgrade must require payment")

        sub.refresh_from_db()
        self.assertNotEqual(sub.plan, "PRO", "Plan must not upgrade without payment")

    @override_settings(ESEWA_USE_MOCK=True)
    def test_cross_tenant_payment_verification_blocked(self):
        """Org B cannot verify a transaction that belongs to Org A."""
        tx = PaymentTransaction.objects.create(
            organization=self.org,   # belongs to org A
            plan='PRO',
            provider='ESEWA',
            amount=PLAN_PRICES['PRO'],
            transaction_id='cross-tenant-tx'
        )
        url = reverse('esewa-verify')
        # Org B tries to verify org A's transaction
        resp = self.other_client.post(url, {
            "transaction_id": tx.transaction_id,
            "reference_id": "MOCK-REF"
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_cannot_initiate_payment(self):
        from rest_framework.test import APIClient
        client = APIClient()
        url = reverse('esewa-init')
        resp = client.post(url, {"plan": "PRO"}, format='json')
        self.assertIn(resp.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])
