from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import Organization
from .models import Employee, Attendance
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
import datetime
User = get_user_model()

class AttendanceApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Test Org")
        self.employee = Employee.objects.create(
            full_name="John Doe",
            organization=self.org,
            status="ACTIVE"
        )
        # Mocking user auth might be complex depending on how it's implemented.
        # Assuming we can just set organization in request or use a test user.
        # However, for simple model testing:
        pass

    def test_attendance_creation(self):
        attendance = Attendance.objects.create(
            organization=self.org,
            employee=self.employee,
            date=datetime.date.today(),
            status="PRESENT"
        )
        self.assertEqual(attendance.status, "PRESENT")
        self.assertEqual(Attendance.objects.count(), 1)

    def test_duplicate_attendance_prevention(self):
        today = datetime.date.today()
        Attendance.objects.create(
            organization=self.org,
            employee=self.employee,
            date=today,
            status="PRESENT"
        )
        
        with self.assertRaises(Exception): # unique_together constraint
            Attendance.objects.create(
                organization=self.org,
                employee=self.employee,
                date=today,
                status="ABSENT"
            )

    def test_csv_import(self):
        # Create a user to authenticate
        user = User.objects.create_user(
            email="test@example.com",
            full_name="Test User",
            organization=self.org,
            password="password123"
        )
        self.client.force_authenticate(user=user)
        
        # Prepare CSV data
        csv_content = (
            "Employee Name, Date, Status, Notes\n"
            "John Doe, 2026-03-01, PRESENT, On time\n"
            "John Doe, 2026-03-02, ABSENT, Sick\n"
        )
        csv_file = SimpleUploadedFile("attendance.csv", csv_content.encode('utf-8'), content_type="text/csv")
        
        url = reverse('attendance-import-csv') # DRF action URL format
        response = self.client.post(url, {'file': csv_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['success_count'], 2)
        self.assertEqual(Attendance.objects.count(), 2)
        
        # Verify records
        att1 = Attendance.objects.get(date="2026-03-01", employee=self.employee)
        self.assertEqual(att1.status, "PRESENT")
        self.assertEqual(att1.notes, "On time")
        
        att2 = Attendance.objects.get(date="2026-03-02", employee=self.employee)
        self.assertEqual(att2.status, "ABSENT")
        self.assertEqual(att2.notes, "Sick")

    def test_export_csv(self):
        user = User.objects.create_user(
            email="test_export@example.com",
            full_name="Export User",
            organization=self.org,
            password="password123"
        )
        self.client.force_authenticate(user=user)
        
        # Create some records
        Attendance.objects.create(
            organization=self.org,
            employee=self.employee,
            date="2026-03-01",
            status="PRESENT",
            notes="Note 1"
        )
        
        url = reverse('attendance-export-csv')
        response = self.client.get(url, {'month': 3, 'year': 2026})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('attachment; filename="attendance_history.csv"', response['Content-Disposition'])
        
        # Check content
        content = b"".join(response.streaming_content).decode('utf-8')
        lines = content.strip().split('\r\n')
        self.assertEqual(len(lines), 2) # Header + 1 record
        self.assertIn("John Doe", lines[1])
        self.assertIn("PRESENT", lines[1])
        self.assertIn("Note 1", lines[1])
