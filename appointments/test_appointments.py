from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User
from apps.core.models import Organization
from apps.invoices.models import Customer
from appointments.models import Service, Staff, Appointment

class AppointmentAPITests(APITestCase):
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
        
        # Create a customer
        self.customer = Customer.objects.create(
            organization=self.org,
            name="John Doe",
            email="john@example.com"
        )
        
        # Create a service
        self.service = Service.objects.create(
            organization=self.org,
            name="Consultation",
            duration_minutes=30,
            price=50.00
        )
        
        # Create a staff member
        self.staff = Staff.objects.create(
            organization=self.org,
            name="Dr. Smith",
            role="Specialist"
        )
        
        self.url = reverse('appointment-list')

    def test_create_appointment(self):
        """Test creating a new appointment."""
        data = {
            "customer": self.customer.id,
            "service": self.service.id,
            "staff": self.staff.id,
            "date": "2026-04-01",
            "time": "10:00:00"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Appointment.objects.count(), 1)
        appt = Appointment.objects.first()
        self.assertEqual(appt.organization, self.org)
        self.assertEqual(appt.status, 'SCHEDULED')

    def test_double_booking_prevention(self):
        """Test that same staff cannot be booked at same time/date."""
        Appointment.objects.create(
            organization=self.org,
            customer=self.customer,
            service=self.service,
            staff=self.staff,
            date="2026-04-01",
            time="10:00:00"
        )
        
        data = {
            "customer": self.customer.id,
            "service": self.service.id,
            "staff": self.staff.id,
            "date": "2026-04-01",
            "time": "10:00:00"
        }
        response = self.client.post(self.url, data)
        # Unique constraint should trigger a 400 error via DRF
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Appointment.objects.count(), 1)

    def test_organization_isolation(self):
        """Test that users can only see their own organization's appointments."""
        # Create an appointment for this org
        Appointment.objects.create(
            organization=self.org,
            customer=self.customer,
            service=self.service,
            staff=self.staff,
            date="2026-04-01",
            time="10:00:00"
        )
        
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
        
        # List appointments - should be empty for the other org
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(data), 0)

    def test_create_appointment_with_new_customer(self):
        """Test creating an appointment and a new customer simultaneously."""
        data = {
            "new_customer_name": "Jane Smith",
            "new_customer_phone": "9876543210",
            "new_customer_email": "jane@example.com",
            "service": self.service.id,
            "staff": self.staff.id,
            "date": "2026-04-02",
            "time": "11:00:00"
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify customer was created
        self.assertTrue(Customer.objects.filter(name="Jane Smith", phone="9876543210").exists())
        customer = Customer.objects.get(name="Jane Smith")
        
        # Verify appointment is linked to the new customer and has service_duration
        appt = Appointment.objects.get(date="2026-04-02", time="11:00:00")
        self.assertEqual(appt.customer, customer)
        self.assertEqual(appt.organization, self.org)
        self.assertEqual(response.data['service_duration'], 30)

    def test_date_range_filtering(self):
        """Test filtering appointments by date range."""
        # Create appointments on different dates
        Appointment.objects.create(
            organization=self.org, customer=self.customer, service=self.service,
            staff=self.staff, date="2026-05-01", time="10:00:00"
        )
        Appointment.objects.create(
            organization=self.org, customer=self.customer, service=self.service,
            staff=self.staff, date="2026-05-05", time="10:00:00"
        )
        Appointment.objects.create(
            organization=self.org, customer=self.customer, service=self.service,
            staff=self.staff, date="2026-05-10", time="10:00:00"
        )

        # Filter for May 1st to May 6th
        response = self.client.get(self.url, {'start_date': '2026-05-01', 'end_date': '2026-05-06'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 2)

        # Filter for May 7th onwards
        response = self.client.get(self.url, {'start_date': '2026-05-07'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results') if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['date'], '2026-05-10')
