from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.core.models import Organization
from appointments.models import Service

class ServiceAPITests(APITestCase):
    def setUp(self):
        # Create an organization
        self.org = Organization.objects.create(name="Test Org", slug="test-org")
        
        # Create a user
        self.user = User.objects.create_user(
            email="test@example.com",
            full_name="Test User",
            password="testpassword",
            organization=self.org
        )
        self.client.force_authenticate(user=self.user)
        
        # Create a sample service
        self.service = Service.objects.create(
            organization=self.org,
            name="Consultation",
            duration_minutes=30,
            price=50.00
        )
        self.url = reverse('service-list')

    def test_list_services(self):
        """Test retrieving the list of services for the user's organization."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check if it's paginated or not
        data = response.json()
        if 'results' in data:
            self.assertEqual(len(data['results']), 1)
            self.assertEqual(data['results'][0]['name'], "Consultation")
        else:
            self.assertEqual(len(data), 1)
            self.assertEqual(data[0]['name'], "Consultation")

    def test_create_service(self):
        """Test creating a new service."""
        data = {
            "name": "Haircut",
            "duration_minutes": 45,
            "price": "30.00"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Service.objects.count(), 2)
        self.assertEqual(Service.objects.latest('id').organization, self.org)

    def test_update_service(self):
        """Test updating an existing service."""
        url = reverse('service-detail', args=[self.service.id])
        data = {"name": "Senior Consultation"}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.service.refresh_from_db()
        self.assertEqual(self.service.name, "Senior Consultation")

    def test_delete_service(self):
        """Test deleting a service."""
        url = reverse('service-detail', args=[self.service.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Service.objects.count(), 0)

    def test_organization_isolation(self):
        """Test that users can only see their own organization's services."""
        # Create another organization and user
        other_org = Organization.objects.create(name="Other Org", slug="other-org")
        other_user = User.objects.create_user(
            email="other@example.com",
            full_name="Other User",
            password="otherpassword",
            organization=other_org
        )
        
        # Authenticate as the other user
        self.client.force_authenticate(user=other_user)
        
        # List services
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if 'results' in data:
            self.assertEqual(len(data['results']), 0)
        else:
            self.assertEqual(len(data), 0)
