from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.core.models import Organization
from crm.models import Expense
from apps.invoices.models import Invoice

User = get_user_model()

class ExpenseTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.org = Organization.objects.create(name="Test Org", slug="test-org")
        self.user = User.objects.create_user(
            email="test@example.com", 
            full_name="Test User",
            password="password", 
            organization=self.org
        )
        self.client.force_authenticate(user=self.user)
        
        # Manually attach organization to request as middleware would do
        # In tests, we might need to mock this or ensure the view handles it correctly
        # The DashboardView uses getattr(request, 'organization', None) or getattr(request.user, 'organization', None)
        # So it should work if we just have the user authenticated.

    def test_create_expense(self):
        url = reverse("expense-list")
        data = {
            "title": "Test Expense",
            "amount": "100.00",
            "category": "General"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Expense.objects.count(), 1)
        self.assertEqual(Expense.objects.first().organization, self.org)

    def test_dashboard_stats(self):
        # Create an expense
        Expense.objects.create(organization=self.org, title="Exp 1", amount=50.00, category="General")
        
        # Create a paid invoice (revenue)
        # We need to make sure we have the required fields for Invoice
        # Let's check apps/invoices/models.py
        # For simplicity, let's just assume it works or create a mock revenue if possible
        # Actually, let's just check if total_expenses is correct in dashboard
        
        url = reverse("dashboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_expenses"], 50.00)
        self.assertEqual(response.data["total_profit"], -50.00) # Revenue is 0

    def test_profit_calculation(self):
        # Create revenue (Paid Invoice)
        # We need a customer too
        from apps.invoices.models import Customer
        customer = Customer.objects.create(organization=self.org, name="Test Customer")
        from django.utils import timezone
        Invoice.objects.create(
            organization=self.org, 
            customer=customer, 
            total=1000.00, 
            status="PAID",
            invoice_number="INV-001",
            date=timezone.now().date()
        )
        
        # Create expense
        Expense.objects.create(organization=self.org, title="Rent", amount=300.00, category="Rent")
        
        url = reverse("dashboard")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["total_revenue"], 1000.00)
        self.assertEqual(response.data["total_expenses"], 300.00)
        self.assertEqual(response.data["total_profit"], 700.00)
