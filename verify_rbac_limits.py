import os
import django

# Setup Django first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.urls import reverse
from apps.accounts.models import User
from apps.invoices.models import Invoice
from apps.core.models import Organization
from unittest.mock import MagicMock

def test_rbac_and_limits():
    client = APIClient()
    
    # 1. Test STAFF cannot delete invoice
    staff = User.objects.get(email='staff@acme.com')
    invoice = Invoice.objects.filter(organization=staff.organization, invoice_number='INV-RBAC-TEST').first()
    
    print(f"Testing RBAC for STAFF user: {staff.email}")
    from apps.invoices.views import InvoiceViewSet
    view = InvoiceViewSet.as_view({'delete': 'destroy'})
    
    # Mock request
    from rest_framework.test import APIRequestFactory
    factory = APIRequestFactory()
    request = factory.delete(f'/api/invoices/{invoice.id}/')
    request.user = staff
    request.organization = staff.organization
    request.user_role = 'STAFF' # Set by middleware in real life
    
    try:
        response = view(request, pk=invoice.id)
        print(f"STAFF DELETE INVOICE RESPONSE: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"STAFF DELETE INVOICE CAUGHT: {e}")
    
    # 2. Test FREE plan team limit
    owner = User.objects.get(email='owner@saas.com') # Owner
    free_org = Organization.objects.get(name='Free Startup')
    
    print(f"\nTesting FREE Plan Limit for Org: {free_org.name}")
    from apps.accounts.views import OrganizationMemberViewSet
    view = OrganizationMemberViewSet.as_view({'post': 'create'})
    
    request = factory.post('/api/accounts/members/', {'email': 'test6@free.com', 'role': 'STAFF'})
    request.user = owner
    request.organization = free_org
    request.user_role = 'OWNER'
    
    try:
        response = view(request)
        print(f"FREE PLAN ADD 6TH MEMBER RESPONSE: {response.status_code} - {response.data}")
    except Exception as e:
        print(f"FREE PLAN ADD 6TH MEMBER CAUGHT: {e}")

if __name__ == "__main__":
    test_rbac_and_limits()

if __name__ == "__main__":
    test_rbac_and_limits()
