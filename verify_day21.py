import os
import django
import uuid

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.core.models import Organization
from apps.accounts.models import OrganizationMember
from apps.billing.models import Usage, PlanLimit, Subscription

User = get_user_model()

def run_rbac_test():
    print("--- Starting RBAC & Team Limit Verification ---")
    
    # 1. Create Org and Owner
    org_id = uuid.uuid4()
    org = Organization.objects.create(
        name=f"Test Company {org_id}",
        slug=f"test-company-{org_id}",
        plan='FREE'
    )
    
    owner = User.objects.create_user(
        email=f"owner_{org_id}@test.com",
        full_name="The Owner",
        organization=org,
        password="password123",
        role="OWNER"
    )
    
    # Verify Member record created by signal
    member = OrganizationMember.objects.get(user=owner, organization=org)
    print(f"✅ Owner Membership Auto-created: {member.role}")
    assert member.role == "OWNER"
    
    # 2. Test Team Member Limit (FREE Plan limit is 5)
    usage = org.usage
    print(f"Current limited for FREE team members: {usage.get_plan_limit('team_members')}")
    
    # Fill up to limit
    for i in range(5):
        can_add, _ = usage.can_add_team_member()
        if can_add:
            usage.increment_team_member_count()
        else:
            print(f"❌ Failed to increment at {i}")
            
    print(f"Team members added: {usage.team_members_added}")
    
    # Try 6th member
    can_add, msg = usage.can_add_team_member()
    if not can_add:
        print(f"✅ Limit enforced correctly: {msg}")
    else:
        print("❌ Limit NOT enforced!")
        
    # 3. Test Role Access (Manual Check of Decorator Logic simulation)
    staff_user = User.objects.create_user(
        email=f"staff_{org_id}@test.com",
        full_name="Staff Member",
        organization=org,
        password="password123",
        role="STAFF"
    )
    
    staff_member = OrganizationMember.objects.get(user=staff_user, organization=org)
    print(f"✅ Staff Membership Created: {staff_member.role}")
    
    allowed_roles = ["OWNER", "ADMIN"]
    if staff_member.role not in allowed_roles:
        print(f"✅ Role restriction simulation passed: STAFF blocked from {allowed_roles}")
    else:
        print("❌ Role restriction simulation failed!")

    print("--- Verification Complete ---")

if __name__ == "__main__":
    run_rbac_test()
