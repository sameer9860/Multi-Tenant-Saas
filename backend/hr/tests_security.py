"""HR security tests: salary visibility, payroll access by role."""
from django.urls import reverse
from rest_framework import status
from apps.core.test_helpers import BaseAPITestCase, make_user, auth_client
from apps.accounts.models import Role
from hr.models import Employee, Department


class SalaryVisibilityTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        dept = Department.objects.create(name="Engineering", organization=self.org)
        self.employee = Employee.objects.create(
            organization=self.org,
            full_name="Jane Doe",
            basic_salary=50000,
            department=dept,
            status="ACTIVE"
        )

    def _get_employee_list(self, client):
        url = reverse('employee-list')
        return client.get(url)

    def test_owner_sees_basic_salary(self):
        resp = self._get_employee_list(self.owner_client)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        self.assertTrue(len(results) > 0)
        self.assertIn('basic_salary', results[0])

    def test_admin_sees_basic_salary(self):
        resp = self._get_employee_list(self.admin_client)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        self.assertIn('basic_salary', results[0])

    def test_staff_cannot_see_basic_salary(self):
        resp = self._get_employee_list(self.staff_client)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        if results:
            self.assertNotIn('basic_salary', results[0])

    def test_staff_cannot_access_payroll(self):
        url = reverse('payroll-list')
        resp = self.staff_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_cannot_access_salary_advances(self):
        url = reverse('salaryadvance-list')
        resp = self.staff_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_accountant_can_access_payroll(self):
        accountant = make_user(
            self.org, email="accountant@test.com", role_name="ACCOUNTANT"
        )
        client = auth_client(accountant)
        url = reverse('payroll-list')
        resp = client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_cross_tenant_employee_not_visible(self):
        """Org B cannot see Org A's employees."""
        url = reverse('employee-list')
        resp = self.other_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        names = [r['full_name'] for r in results]
        self.assertNotIn("Jane Doe", names)
