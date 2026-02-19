
import os
import django
import uuid

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Organization
from apps.accounts.models import OrganizationMember
from crm.models import Client
from apps.billing.models import Subscription, Usage
from apps.invoices.models import Invoice

User = get_user_model()

def prepare_proofs():
    print("--- Preparing Professional Multi-Tenant Proofs ---")
    
    # 1. Create Business A: Acme Corp
    acme, _ = Organization.objects.get_or_create(
        slug="acme-corp",
        defaults={"name": "Acme Corp", "plan": "PRO"}
    )
    
    # 2. Create Business B: Globex Corp
    globex, _ = Organization.objects.get_or_create(
        slug="globex-corp",
        defaults={"name": "Globex Corp", "plan": "FREE"}
    )
    
    # 3. Use an existing owner or create one
    owner_email = "owner@saas.com"
    owner, created = User.objects.get_or_create(
        email=owner_email,
        defaults={
            "full_name": "Main Owner",
            "organization": acme, # Primary is Acme
            "role": "OWNER"
        }
    )
    if created:
        owner.set_password("password123")
        owner.save()
    
    # Link owner to both businesses via memberships
    OrganizationMember.objects.get_or_create(user=owner, organization=acme, defaults={"role": "OWNER"})
    OrganizationMember.objects.get_or_create(user=owner, organization=globex, defaults={"role": "OWNER"})
    
    # 4. Create unique data for Acme
    Client.objects.get_or_create(organization=acme, name="Acme VIP Customer", email="vip@acme.com")
    
    # 5. Create unique data for Globex
    Client.objects.get_or_create(organization=globex, name="Globex Secret Client", email="secret@globex.com")
    
    # 6. Verify isolation
    acme_clients = Client.objects.filter(organization=acme).count()
    globex_clients = Client.objects.filter(organization=globex).count()
    
    print(f"✅ Acme Corp Clients: {acme_clients}")
    print(f"✅ Globex Corp Clients: {globex_clients}")
    
    # 7. Add a STAFF user for Acme
    staff_user, created = User.objects.get_or_create(
        email="staff@acme.com",
        defaults={
            "full_name": "Acme Staff",
            "organization": acme,
            "role": "STAFF"
        }
    )
    if created:
        staff_user.set_password("password123")
        staff_user.save()
    
    OrganizationMember.objects.get_or_create(user=staff_user, organization=acme, defaults={"role": "STAFF"})
    
    # 8. Add an Accountant for Globex
    accountant, created = User.objects.get_or_create(
        email="finance@globex.com",
        defaults={
            "full_name": "Globex Accountant",
            "organization": globex,
            "role": "ACCOUNTANT"
        }
    )
    if created:
        accountant.set_password("password123")
        accountant.save()
    
    OrganizationMember.objects.get_or_create(user=accountant, organization=globex, defaults={"role": "ACCOUNTANT"})

    print("--- Proof Data Ready ---")
    print(f"Owner Login: {owner_email} / password123")
    print(f"Staff Login: staff@acme.com / password123 (Restricted)")

if __name__ == "__main__":
    prepare_proofs()
