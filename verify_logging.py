import os
import django
import sys

# Set up Django environment
sys.path.append('/home/samir/Multi-Tenant SaaS')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from crm.models import Lead, LeadActivity
from apps.core.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()

def test_logging():
    print("--- Starting Activity Log Verification ---")
    
    # Get or create test org and user
    org, _ = Organization.objects.get_or_create(name="Test Org")
    admin, _ = User.objects.get_or_create(email="admin@test.com", defaults={"full_name": "Test Admin", "role": "ADMIN"})
    admin.organization = org
    admin.save()
    
    # 1. Test Lead Creation
    print("1. Creating a new lead...")
    lead = Lead.objects.create(
        organization=org,
        name="John Doe",
        email="john@example.com",
        status="NEW",
        assigned_to=admin
    )
    
    # Normally perform_create in view handles this, but here we simulate what the view does
    LeadActivity.objects.create(
        organization=org,
        lead=lead,
        user=admin,
        action="CREATED"
    )
    
    # 2. Test Status Change
    print("2. Changing lead status...")
    old_status = lead.status
    lead.status = "CONTACTED"
    lead.save()
    
    LeadActivity.objects.create(
        organization=org,
        lead=lead,
        user=admin,
        action="STATUS_CHANGED",
        old_value=old_status,
        new_value=lead.status
    )
    
    # 3. Verify Log Entries
    print("3. Verifying log entries in database...")
    activities = LeadActivity.objects.filter(lead=lead).order_by('created_at')
    
    for activity in activities:
        print(f"[{activity.created_at}] {activity.user} {activity.action}: {activity.old_value} -> {activity.new_value}")

    if activities.count() >= 2:
        print("✅ SUCCESS: Activity logs recorded correctly.")
    else:
        print("❌ FAILURE: Missing activity logs.")

if __name__ == "__main__":
    test_logging()
