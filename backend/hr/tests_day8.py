import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from hr.models import Payroll, Employee, Department, Organization
from datetime import date
import io

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_data():
    org = Organization.objects.create(name="Test Org")
    dept = Department.objects.create(name="Engineering", organization=org)
    employee = Employee.objects.create(
        full_name="John Doe",
        organization=org,
        department=dept,
        basic_salary=50000
    )
    payroll = Payroll.objects.create(
        organization=org,
        employee=employee,
        month=date(2026, 3, 1),
        basic_salary=50000,
        status='FINALIZED'
    )
    return org, employee, payroll

@pytest.mark.django_db
def test_payslip_download(api_client, setup_data):
    org, employee, payroll = setup_data
    
    # Create a user and authenticate
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.create_user(
        email='testuser@example.com',
        full_name='Test User',
        password='password123',
        organization=org
    )
    api_client.force_authenticate(user=user)
    
    url = reverse('payroll-download-payslip', kwargs={'pk': payroll.id})
    response = api_client.get(url)
    
    assert response.status_code == 200
    assert response['Content-Type'] == 'application/pdf'
    assert 'attachment' in response['Content-Disposition']
    assert f"payslip_{employee.full_name.replace(' ', '_')}" in response['Content-Disposition']
    
    # Check if PDF content is likely valid
    content = response.content
    assert content.startswith(b'%PDF-')
