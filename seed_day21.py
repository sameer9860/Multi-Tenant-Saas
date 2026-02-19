import os
import sys
import django
import uuid

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User, OrganizationMember
from apps.core.models import Organization
from crm.models import Lead, Client
from apps.invoices.models import Invoice, Customer
from apps.billing.models import Subscription, Usage

def seed():
    print("Starting Day 21 data seeding...")

    # 1. Ensure owner@saas.com exists
    user = User.objects.filter(email='owner@saas.com').first()
    if not user:
        print("Creating owner@saas.com...")
        user = User.objects.create_superuser(
            email='owner@saas.com',
            password='password123',
            full_name='Saas Owner'
        )
    
    # 2. Ensure Acme and Globex exist
    acme, _ = Organization.objects.get_or_create(
        name='Acme Corp',
        defaults={'plan': 'PRO'}
    )
    globex, _ = Organization.objects.get_or_create(
        name='Globex Corp',
        defaults={'plan': 'PRO'}
    )

    # 3. Ensure memberships are correct
    OrganizationMember.objects.get_or_create(
        user=user,
        organization=acme,
        defaults={'role': 'OWNER'}
    )
    OrganizationMember.objects.get_or_create(
        user=user,
        organization=globex,
        defaults={'role': 'OWNER'}
    )

    # 4. Set current org to Acme
    user.organization = acme
    user.role = 'OWNER'
    user.save()

    # 5. Seed specific Leads/Clients
    # Acme VIP Customer
    acme_vip, _ = Lead.objects.get_or_create(
        organization=acme,
        name='Acme VIP Customer',
        defaults={
            'email': 'vip@acme.com',
            'phone': '555-0101',
            'status': 'CONVERTED',
            'source': 'DIRECT'
        }
    )
    Client.objects.get_or_create(
        organization=acme,
        name=acme_vip.name,
        defaults={
            'email': acme_vip.email,
            'phone': acme_vip.phone,
            'company': 'Acme Corp VIP'
        }
    )

    # Globex Secret Client
    globex_secret, _ = Lead.objects.get_or_create(
        organization=globex,
        name='Globex Secret Client',
        defaults={
            'email': 'secret@globex.com',
            'phone': '555-0202',
            'status': 'CONVERTED',
            'source': 'REFERRAL'
        }
    )
    Client.objects.get_or_create(
        organization=globex,
        name=globex_secret.name,
        defaults={
            'email': globex_secret.email,
            'phone': globex_secret.phone,
            'company': 'Globex Inc'
        }
    )

    # A lead to practice conversion/update
    Lead.objects.get_or_create(
        organization=acme,
        name='Virat',
        defaults={
            'email': 'virat@example.com',
            'status': 'NEW'
        }
    )

    # 7. Scenario for Role-Based Restriction (STAFF cannot delete invoice)
    staff_user, _ = User.objects.get_or_create(
        email='staff@acme.com',
        defaults={
            'full_name': 'Acme Staff',
            'organization': acme,
            'role': 'STAFF'
        }
    )
    if _: staff_user.set_password('password123'); staff_user.save()
    
    # Create invoice for deletion test
    from apps.invoices.models import Invoice, Customer
    from django.utils import timezone
    cust, _ = Customer.objects.get_or_create(organization=acme, name="Test Customer")
    Invoice.objects.get_or_create(
        organization=acme,
        customer=cust,
        invoice_number="INV-RBAC-TEST",
        defaults={
            'total': 100,
            'date': timezone.now().date()
        }
    )

    # 8. Scenario for Plan Limit (FREE plan limit 5)
    free_org, _ = Organization.objects.get_or_create(
        name='Free Startup',
        defaults={'plan': 'FREE'}
    )
    Subscription.objects.get_or_create(organization=free_org, defaults={'plan': 'FREE'})
    usage_free, _ = Usage.objects.get_or_create(organization=free_org)
    
    # Add 5 members
    for i in range(1, 6):
        u, _ = User.objects.get_or_create(
            email=f'user{i}@free.com',
            defaults={
                'full_name': f'Free User {i}',
                'organization': free_org,
                'role': 'STAFF'
            }
        )
        if _: u.set_password('password123'); u.save()
    
    usage_free.team_members_added = 5
    usage_free.save()

    print("Success: Day 21 data seeded.")
    print(f"Acme ID: {acme.id}")
    print(f"Globex ID: {globex.id}")
    print(f"Free Startup ID: {free_org.id}")

if __name__ == "__main__":
    seed()
