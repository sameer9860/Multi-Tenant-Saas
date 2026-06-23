from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.core.models import Organization
from apps.billing.models import Subscription
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class UpgradePlanTests(APITestCase):
    def setUp(self):
        # Create organization first
        self.organization = Organization.objects.create(
            name='Test Org',
            plan='FREE'
        )
        # Create user with organization
        self.user = User.objects.create_user(
            email='test@example.com', 
            password='password123',
            full_name='Test User',
            organization=self.organization
        )
        self.organization.owner = self.user
        self.organization.save()
        
        # Get the subscription auto-created by signals
        self.subscription = self.organization.subscription
        self.subscription.plan = 'FREE'
        self.subscription.is_active = True
        self.subscription.is_trial = False  # Default to not trial
        self.subscription.save()
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
        self.url = reverse('subscriptions:upgrade_plan')

    def test_upgrade_during_trial(self):
        """Test that user on active trial can upgrade to PRO without payment"""
        # Set user to trial mode
        self.subscription.is_trial = True
        self.subscription.trial_end = timezone.now() + timedelta(days=7)
        self.subscription.save()
        
        data = {'plan': 'PRO'}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should not return payment URL or require payment
        self.assertNotIn('requires_payment', response.data)
        self.assertEqual(response.data['plan'], 'PRO')
        
        # Verify DB updates
        self.subscription.refresh_from_db()
        self.organization.refresh_from_db()
        self.assertEqual(self.subscription.plan, 'PRO')
        self.assertEqual(self.organization.plan, 'PRO')

    def test_upgrade_normal_user(self):
        """Test that normal user (not trial) requires payment to upgrade"""
        self.subscription.is_trial = False
        self.subscription.trial_end = None
        self.subscription.save()
        
        data = {'plan': 'PRO'}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('requires_payment'))
        self.assertIn('esewa_url', response.data)
        
        # Verify DB NOT updated yet (pending payment)
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.plan, 'FREE')

    def test_downgrade_to_free(self):
        """Test that downgrade to free is always immediate"""
        # Start on PRO
        self.subscription.plan = 'PRO'
        self.subscription.save()
        self.organization.plan = 'PRO'
        self.organization.save()
        
        data = {'plan': 'FREE'}
        response = self.client.post(self.url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['plan'], 'FREE')
        
        # Verify DB updates
        self.subscription.refresh_from_db()
        self.organization.refresh_from_db()
        self.assertEqual(self.subscription.plan, 'FREE')
        self.assertEqual(self.organization.plan, 'FREE')
