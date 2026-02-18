from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.core.models import Organization
from apps.accounts.models import User
from crm.models import Lead, Client
from apps.subscriptions.limits import PLAN_LIMITS

class CRMUsageLimitsTests(APITestCase):

    def setUp(self):
        # Create Organization
        self.org = Organization.objects.create(
            name="Test Org",
            slug="test-org",
            plan="FREE"
        )
        
        # Create Admin User
        self.admin_user = User.objects.create_user(
            email="admin@test.com",
            full_name="Admin User",
            organization=self.org,
            password="password123",
            role="ADMIN"
        )
        
        # Create Staff User
        self.staff_user = User.objects.create_user(
            email="staff@test.com",
            full_name="Staff User",
            organization=self.org,
            password="password123",
            role="STAFF"
        )

    def test_free_plan_lead_limit(self):
        """Test that FREE plan is limited to 20 leads."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('lead-list')
        
        # Fill up to the limit (20)
        # Note: We can create leads directly to speed up setup
        leads = [Lead(organization=self.org, name=f"Lead {i}") for i in range(20)]
        Lead.objects.bulk_create(leads)
        
        self.assertEqual(self.org.leads.count(), 20)
        
        # Try to create 21st lead
        data = {"name": "21st Lead"}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "Lead limit reached. Upgrade your plan.")

    def test_basic_plan_higher_limit(self):
        """Test that BASIC plan has higher limits."""
        self.org.plan = "BASIC"
        self.org.save()
        
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('lead-list')
        
        # Create 21 leads
        leads = [Lead(organization=self.org, name=f"Lead {i}") for i in range(21)]
        Lead.objects.bulk_create(leads)
        
        # Try to create another one
        data = {"name": "Another Lead"}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_staff_role_permissions(self):
        """Test that STAFF role can only read data."""
        # Create a lead first
        Lead.objects.create(organization=self.org, name="Existing Lead")
        
        self.client.force_authenticate(user=self.staff_user)
        
        # Test List (GET) - OK
        url_list = reverse('lead-list')
        response = self.client.get(url_list)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Test Create (POST) - Forbidden
        data = {"name": "New Lead"}
        response = self.client.post(url_list, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test Update (PUT) - Forbidden
        lead = Lead.objects.first()
        url_detail = reverse('lead-detail', args=[lead.id])
        response = self.client.put(url_detail, {"name": "Updated Lead"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test Delete (DELETE) - Forbidden
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_role_full_access(self):
        """Test that ADMIN role has full access."""
        Lead.objects.create(organization=self.org, name="Existing Lead")
        self.client.force_authenticate(user=self.admin_user)
        
        # Test Create
        url_list = reverse('lead-list')
        response = self.client.post(url_list, {"name": "New Admin Lead"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Test Delete
        lead = Lead.objects.get(name="Existing Lead")
        url_detail = reverse('lead-detail', args=[lead.id])
        response = self.client.delete(url_detail)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_client_limit_enforcement(self):
        """Test that client limits are also enforced."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('client-list')
        
        # FREE limit for clients is 10
        clients = [Client(organization=self.org, name=f"Client {i}") for i in range(10)]
        Client.objects.bulk_create(clients)
        
        # Try to create 11th client
        data = {"name": "11th Client"}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['detail'], "Client limit reached. Upgrade your plan.")

    def test_dashboard_invoice_limit_values(self):
        """Dashboard API should report proper invoice limits (not -1) for all plans."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('dashboard')

        # for each plan, ensure limit is correct or null
        for plan, expected_limit in [('FREE', 10), ('BASIC', 1000), ('PRO', None)]:
            self.org.plan = plan
            self.org.save()
            if hasattr(self.org, 'usage'):
                # reset or update usage if needed
                self.org.usage.invoices_created = 0
                self.org.usage.save()

            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            limit = data.get('usage', {}).get('invoices', {}).get('limit')
            # None == unlimited case
            self.assertEqual(limit, expected_limit)
