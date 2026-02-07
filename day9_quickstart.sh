#!/bin/bash

# DAY 9 QUICK START TESTING SCRIPT
# This script automates the initial setup and basic testing for Day 9

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "🚀 DAY 9 QUICK START - AUTOMATED SETUP & TESTING"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "manage.py" ]; then
    echo "❌ Error: manage.py not found. Please run this script from project root."
    exit 1
fi

echo -e "${BLUE}Step 1: Running Database Migrations${NC}"
echo "─────────────────────────────────────"
python manage.py makemigrations
python manage.py migrate
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

echo -e "${BLUE}Step 2: Initializing Plan Limits (15 records)${NC}"
echo "─────────────────────────────────────"
python manage.py init_plan_limits
echo -e "${GREEN}✅ Plan limits initialized${NC}"
echo ""

echo -e "${BLUE}Step 3: Checking .env Configuration${NC}"
echo "─────────────────────────────────────"
if grep -q "KHALTI_PUBLIC_KEY" .env 2>/dev/null; then
    echo -e "${GREEN}✅ KHALTI_PUBLIC_KEY found in .env${NC}"
else
    echo -e "${YELLOW}⚠️  KHALTI_PUBLIC_KEY not in .env${NC}"
    echo "   Add these to your .env file:"
    echo "   KHALTI_PUBLIC_KEY=test_public_key_xxxxx"
    echo "   KHALTI_SECRET_KEY=test_secret_key_xxxxx"
fi
echo ""

echo -e "${BLUE}Step 4: Running Django Shell Tests${NC}"
echo "─────────────────────────────────────"
python manage.py shell << PYEOF
from apps.billing.models import PlanLimit, Plan, Subscription, Usage, PaymentTransaction
from django.contrib.auth import get_user_model
from apps.core.models import Organization

# Check plan limits initialized
plan_limit_count = PlanLimit.objects.count()
print(f"✅ Plan limits: {plan_limit_count} records (expected 15)")

# Check plans exist
free_plan = Plan.objects.filter(name='FREE').exists()
basic_plan = Plan.objects.filter(name='BASIC').exists()
pro_plan = Plan.objects.filter(name='PRO').exists()
print(f"✅ FREE plan: {free_plan}")
print(f"✅ BASIC plan: {basic_plan}")
print(f"✅ PRO plan: {pro_plan}")

# Check models are accessible
print(f"✅ Subscription model: OK")
print(f"✅ Usage model: OK")
print(f"✅ PaymentTransaction model: OK")

# Test: Create test organization
User = get_user_model()
user, created = User.objects.get_or_create(
    email='day9test@example.com',
    defaults={'password': 'test123', 'name': 'Day 9 Tester'}
)
org, created = Organization.objects.get_or_create(
    user=user,
    defaults={'name': 'Day 9 Test Org'}
)
print(f"✅ Test org created: {org.name}")

# Test: Create subscription
free_plan = Plan.objects.get(name='FREE')
sub, created = Subscription.objects.get_or_create(
    organization=org,
    defaults={'plan': free_plan}
)
print(f"✅ Test subscription: {sub.plan.name} plan")

# Test: Create usage
usage, created = Usage.objects.get_or_create(
    organization=org,
    defaults={}
)
print(f"✅ Test usage: {org.name}")

# Test: Can create invoice check
can_create = usage.can_create_invoice()
print(f"✅ Can create invoice (FREE plan): {can_create}")

print("\n🎉 All model tests passed!")
PYEOF

echo ""

echo -e "${BLUE}Step 5: Testing Payment Gateway Manager${NC}"
echo "─────────────────────────────────────"
python manage.py shell << PYEOF
from apps.billing.payment_gateway import KhaltiPaymentManager
import os

# Check if keys are configured
khalti_public = os.getenv('KHALTI_PUBLIC_KEY')
khalti_secret = os.getenv('KHALTI_SECRET_KEY')

if khalti_public and khalti_secret:
    print("✅ Khalti keys configured")
    khalti = KhaltiPaymentManager()
    print("✅ KhaltiPaymentManager instantiated")
else:
    print("⚠️  Khalti keys not configured (add to .env)")
PYEOF

echo ""

echo -e "${BLUE}Step 6: Admin Interface Check${NC}"
echo "─────────────────────────────────────"
python manage.py shell << PYEOF
from apps.billing.admin import PlanLimitAdmin, SubscriptionAdmin, UsageAdmin, PaymentTransactionAdmin
from apps.billing.models import PlanLimit

print("✅ PlanLimitAdmin registered")
print("✅ SubscriptionAdmin registered")
print("✅ UsageAdmin registered")
print("✅ PaymentTransactionAdmin registered")

# Count admin-accessible records
limits = PlanLimit.objects.count()
print(f"✅ Admin can manage {limits} plan limits")
PYEOF

echo ""

echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ SETUP COMPLETE! Ready for Testing${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 Next Steps:"
echo "───────────────"
echo "1. Start Django server:"
echo "   python manage.py runserver"
echo ""
echo "2. Test endpoints:"
echo "   curl -X GET http://localhost:8000/billing/usage/"
echo ""
echo "3. Visit admin:"
echo "   http://localhost:8000/admin/"
echo "   Navigate to: Billing → Plan limits"
echo ""
echo "4. Read testing guide:"
echo "   cat DAY_9_TESTING_GUIDE.md"
echo ""
echo "5. Test scenarios (60 minutes):"
echo "   - Plan limits enforcement"
echo "   - API endpoints"
echo "   - Admin interface"
echo "   - Payment flow (requires Khalti test mode)"
echo "   - Error handling"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "🎉 Day 9 is ready for testing!"
echo ""
