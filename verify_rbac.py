import os
import django
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Organization
from crm.models import Lead
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

def run_test():
    print("Setting up test environment...")
    # Create Organization
    org, _ = Organization.objects.get_or_create(name="Test Org")
    
    # Create Users
    admin_user, _ = User.objects.get_or_create(email="admin@test.com", defaults={
        "full_name": "Admin User",
        "organization": org,
        "role": "ADMIN",
        "password": "password123"
    })
    admin_user.set_password("password123")
    admin_user.save()

    staff_user, _ = User.objects.get_or_create(email="staff@test.com", defaults={
        "full_name": "Staff User",
        "organization": org,
        "role": "STAFF",
        "password": "password123"
    })
    staff_user.set_password("password123")
    staff_user.save()

    # Create Clients
    client = APIClient()

    # 1. Admin Create Lead
    print("\n--- Testing ADMIN Create Lead ---")
    client.force_authenticate(user=admin_user)
    response = client.post("/api/crm/leads/", {"name": "Admin Lead", "email": "admin@lead.com"})
    if response.status_code == status.HTTP_201_CREATED:
        print("✅ PASS: Admin created lead.")
        lead_id = response.data['id']
    else:
        print(f"❌ FAIL: Admin failed to create lead. Status: {response.status_code}, Data: {response.data}")
        return

    # 2. Staff Create Lead (Should Fail)
    print("\n--- Testing STAFF Create Lead ---")
    client.force_authenticate(user=staff_user)
    response = client.post("/api/crm/leads/", {"name": "Staff Lead", "email": "staff@lead.com"})
    if response.status_code == status.HTTP_403_FORBIDDEN:
        print("✅ PASS: Staff properly denied creation.")
    else:
        print(f"❌ FAIL: Staff was able to create lead (or other error). Status: {response.status_code}")

    # 3. Staff Update Lead (Should Succeed with new permissions, Fail with current)
    print("\n--- Testing STAFF Update Lead ---")
    # Using the lead created by Admin
    response = client.patch(f"/api/crm/leads/{lead_id}/", {"status": "CONTACTED"})
    if response.status_code == status.HTTP_200_OK:
        print("✅ PASS: Staff updated lead.")
    elif response.status_code == status.HTTP_403_FORBIDDEN:
        print("⚠️ NOTE: Staff currently denied update (Expected behavior before fix).")
    else:
        print(f"❌ FAIL: Unexpected status for Staff update. Status: {response.status_code}")

    # 4. Staff Delete Lead (Should Fail)
    print("\n--- Testing STAFF Delete Lead ---")
    response = client.delete(f"/api/crm/leads/{lead_id}/")
    if response.status_code == status.HTTP_403_FORBIDDEN:
        print("✅ PASS: Staff properly denied delete.")
    else:
        print(f"❌ FAIL: Staff was able to delete lead. Status: {response.status_code}")
    
    # Cleanup
    Lead.objects.filter(email__in=["admin@lead.com", "staff@lead.com"]).delete()
    print("\nTest Run Complete.")

if __name__ == "__main__":
    run_test()
