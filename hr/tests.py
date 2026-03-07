from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import Organization
from .models import Employee, Attendance
import datetime

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
