from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.core.models import Organization
from hr.models import Employee, SalaryAdvance, Payroll, Attendance
from django.contrib.auth import get_user_model
import datetime

User = get_user_model()

class SalaryAdvanceTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Test Org")
        self.user = User.objects.create_user(
            email="hr@example.com",
            full_name="HR Admin",
            organization=self.org,
            password="password123"
        )
        self.client.force_authenticate(user=self.user)
        self.employee = Employee.objects.create(
            full_name="Jane Doe",
            organization=self.org,
            basic_salary=30000.00,
            status="ACTIVE"
        )

    def test_create_salary_advance(self):
        url = reverse('salary-advance-list')
        data = {
            "employee": self.employee.id,
            "amount": 5000.00,
            "deduct_in_month": "2026-04-01",
            "reason": "Emergency"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SalaryAdvance.objects.count(), 1)
        advance = SalaryAdvance.objects.first()
        self.assertEqual(float(advance.amount), 5000.00)
        self.assertEqual(advance.deduct_in_month, datetime.date(2026, 4, 1))

    def test_payroll_auto_deduction(self):
        # 1. Create advance for April
        SalaryAdvance.objects.create(
            organization=self.org,
            employee=self.employee,
            amount=5000.00,
            deduct_in_month=datetime.date(2026, 4, 1)
        )

        # 2. Generate payroll for April
        url = reverse('payroll-generate-payroll')
        data = {"month": 4, "year": 2026}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Verify payroll deduction
        payroll = Payroll.objects.get(employee=self.employee, month=datetime.date(2026, 4, 1))
        self.assertEqual(float(payroll.advance_deduction), 5000.00)
        
        # Basic: 30000, Adv: 5000, Net should be 25000 (assuming no attendance issues)
        # Note: calculate_net_salary is called on save.
        self.assertEqual(float(payroll.net_salary), 25000.00)

    def test_edit_payroll(self):
        payroll = Payroll.objects.create(
            organization=self.org,
            employee=self.employee,
            month=datetime.date(2026, 4, 1),
            basic_salary=30000.00
        )
        url = reverse('payroll-detail', args=[payroll.id])
        data = {
            "allowances": 1000.00,
            "advance_deduction": 2000.00,
            "deductions": 500.00
        }
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        payroll.refresh_from_db()
        self.assertEqual(float(payroll.allowances), 1000.00)
        self.assertEqual(float(payroll.advance_deduction), 2000.00)
        self.assertEqual(float(payroll.deductions), 500.00)
        # 30000 + 1000 - 2000 - 500 = 28500
        self.assertEqual(float(payroll.net_salary), 28500.00)

    def test_export_csv_with_advance_deduction(self):
        Payroll.objects.create(
            organization=self.org,
            employee=self.employee,
            month=datetime.date(2026, 4, 1),
            basic_salary=30000.00,
            advance_deduction=5000.00,
            allowances=2000.00,
            deductions=1000.00
        )
        url = reverse('payroll-export-csv')
        response = self.client.get(url, {"month": 4, "year": 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        
        content = response.content.decode('utf-8')
        lines = content.splitlines()
        self.assertIn('Advance Deduction', lines[0])
        self.assertIn('5000.0', lines[1])
