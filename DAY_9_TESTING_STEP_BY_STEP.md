# 🎯 DAY 9 COMPLETE - FINAL SUMMARY

---

## 📊 WHAT NEEDS TO BE TESTED - STEP BY STEP

### ⏱️ TOTAL TIME REQUIRED: ~60 minutes

---

## 🚀 STEP 1: SETUP (5 minutes)

### 1.1 Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```
**Expected Output:**
- Creating migration files
- Applying migrations
- Database updated
- PlanLimit table created
- Usage table enhanced
- PaymentTransaction table enhanced

**Verify:**
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit
>>> PlanLimit.objects.count()
# Should return: 0 (not yet initialized)
```

### 1.2 Initialize Plan Limits
```bash
python manage.py init_plan_limits
```

**Expected Output:**
```
Creating plan limits...
✓ FREE - invoices: 10
✓ FREE - customers: 5
✓ FREE - team_members: 1
✓ FREE - api_calls: 100
✓ BASIC - invoices: 1000
✓ BASIC - customers: 50
✓ BASIC - team_members: 3
✓ BASIC - api_calls: 10000
✓ PRO - invoices: 999999
✓ PRO - customers: 999999
✓ PRO - team_members: 999999
✓ PRO - api_calls: 999999
✓ Added 3 more records for future features
Successfully initialized 15 plan limits!
```

**Verify:**
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit
>>> PlanLimit.objects.count()
# Should return: 15 ✅
```

---

## 🔑 STEP 2: CONFIGURATION (5 minutes)

### 2.1 Add Khalti Keys to .env

**Create/Edit .env file:**
```bash
# If .env doesn't exist
touch .env

# Add these lines
echo "KHALTI_PUBLIC_KEY=test_public_key_xxxxx" >> .env
echo "KHALTI_SECRET_KEY=test_secret_key_xxxxx" >> .env
```

> 💡 **Get test keys from:** https://dashboard.khalti.com (create test merchant)

**Verify:**
```bash
# Check .env has the keys
grep KHALTI .env

# Should output:
# KHALTI_PUBLIC_KEY=test_public_key_xxxxx
# KHALTI_SECRET_KEY=test_secret_key_xxxxx
```

### 2.2 Test Configuration Loads
```bash
python manage.py shell
>>> from django.conf import settings
>>> print(settings.KHALTI_PUBLIC_KEY)
# Should show: test_public_key_xxxxx

>>> print(settings.KHALTI_SECRET_KEY)
# Should show: test_secret_key_xxxxx
```

---

## ✅ STEP 3: ADMIN INTERFACE TEST (10 minutes)

### 3.1 Start Django Server
```bash
python manage.py runserver
```
**Expected:** Server starts on http://localhost:8000

### 3.2 Visit Admin Dashboard
```
URL: http://localhost:8000/admin/
Username: your_admin_username
Password: your_admin_password
```

### 3.3 Test Plan Limits
1. Click **"Billing"** → **"Plan limits"**
2. **Verify:** See 15 records listed
3. **Check columns:** Plan, Feature, Limit Value
4. **Test filter:** Select "FREE" plan → See 4 records
5. **Test edit:** Click any record, change limit to 999, Save
6. **Verify:** Change saved and displayed

### 3.4 Test Usage Admin
1. Click **"Billing"** → **"Usages"**
2. **Verify:** Can see all organizations' usage
3. **Check columns:** Organization, Invoices Created, Customers Created, Team Members Added

### 3.5 Test Payment Transactions
1. Click **"Billing"** → **"Payment transactions"**
2. **Verify:** Table exists (may be empty if no payments yet)
3. **Check columns:** Organization, Plan, Amount, Status, Provider, Created At

### 3.6 Test Subscriptions
1. Click **"Billing"** → **"Subscriptions"**
2. **Verify:** Can see subscription records
3. **Check columns:** Organization, Plan, Is Active, Start Date, End Date

---

## 🎯 STEP 4: PLAN LIMITS ENFORCEMENT TEST (10 minutes)

### 4.1 Create Test Organization

```bash
python manage.py shell
```

```python
from django.contrib.auth import get_user_model
from apps.core.models import Organization
from apps.billing.models import Plan, Subscription, Usage

User = get_user_model()

# Create user
user, _ = User.objects.get_or_create(
    email='test@example.com',
    defaults={'name': 'Test User', 'password': 'test123'}
)

# Create org
org, _ = Organization.objects.get_or_create(
    user=user,
    defaults={'name': 'Test Org'}
)

# Get FREE plan
free_plan = Plan.objects.get(name='FREE')

# Create subscription
sub, _ = Subscription.objects.get_or_create(
    organization=org,
    defaults={'plan': free_plan}
)

# Create usage
usage, _ = Usage.objects.get_or_create(
    organization=org
)

print(f"✅ Created test org: {org.name}")
print(f"✅ Plan: {sub.plan.name}")
print(f"✅ Can create invoice: {usage.can_create_invoice()}")
```

**Expected Output:**
```
✅ Created test org: Test Org
✅ Plan: FREE
✅ Can create invoice: True
```

### 4.2 Test FREE Plan Limit (10 invoices)

```python
# Create 10 invoices
for i in range(10):
    usage.invoices_created += 1
    usage.save()
    print(f"Invoice {i+1}: {usage.can_create_invoice()}")

# Expected: All show True except possibly last
```

**Expected Output:**
```
Invoice 1: True
Invoice 2: True
Invoice 3: True
...
Invoice 10: True
```

### 4.3 Test Exceeding Limit

```python
# Try 11th invoice
usage.invoices_created += 1
usage.save()
can_create = usage.can_create_invoice()
print(f"Can create 11th invoice: {can_create}")

# Also test the decorator response
# (Next step in API testing)
```

**Expected Output:**
```
Can create 11th invoice: False ✅
```

### 4.4 Test BASIC Plan (1,000 invoices)

```python
# Upgrade to BASIC
basic_plan = Plan.objects.get(name='BASIC')
sub.plan = basic_plan
sub.save()
usage.invoices_created = 0  # Reset
usage.save()

# Test limit
usage.invoices_created = 1000
usage.save()
print(f"Can create 1000 invoices in BASIC: {usage.can_create_invoice()}")

usage.invoices_created = 1001
usage.save()
print(f"Can create 1001 invoices in BASIC: {usage.can_create_invoice()}")
```

**Expected Output:**
```
Can create 1000 invoices in BASIC: True
Can create 1001 invoices in BASIC: False ✅
```

### 4.5 Test PRO Plan (Unlimited)

```python
# Upgrade to PRO
pro_plan = Plan.objects.get(name='PRO')
sub.plan = pro_plan
sub.save()
usage.invoices_created = 0
usage.save()

# Test unlimited
usage.invoices_created = 99999
usage.save()
print(f"Can create 99999 invoices in PRO: {usage.can_create_invoice()}")
```

**Expected Output:**
```
Can create 99999 invoices in PRO: True ✅
```

---

## 🌐 STEP 5: API ENDPOINTS TEST (15 minutes)

### 5.1 Get JWT Token

**Option A: Via admin**
```bash
python manage.py shell
>>> from rest_framework_simplejwt.tokens import RefreshToken
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.get(email='test@example.com')
>>> refresh = RefreshToken.for_user(user)
>>> access_token = str(refresh.access_token)
>>> print(access_token)
# Copy this token for next requests
```

### 5.2 Test: GET /billing/usage/

```bash
curl -X GET http://localhost:8000/billing/usage/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Expected Response (200 OK):**
```json
{
  "current_plan": "FREE",
  "organization": "Test Org",
  "usage": {
    "invoices_created": 0,
    "invoices_limit": 10,
    "invoices_remaining": 10,
    "invoices_percentage": 0
  },
  "customers": {
    "created": 0,
    "limit": 5,
    "remaining": 5,
    "percentage": 0
  },
  "team_members": {
    "added": 0,
    "limit": 1,
    "remaining": 1,
    "percentage": 0
  }
}
```

### 5.3 Test: POST /billing/khalti/init/

```bash
curl -X POST http://localhost:8000/billing/khalti/init/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "plan": "PRO",
    "amount": 3900,
    "return_url": "http://localhost:3000/billing/success"
  }'
```

**Expected Response (200 OK):**
```json
{
  "payment_id": "61de7e7b6d4bea00086c8b1f",
  "status": "INITIATED",
  "payload": {
    "return_url": "http://localhost:3000/billing/success",
    "website_url": "http://localhost:8000",
    "amount": 3900,
    "purchase_order_id": "61de7e7b6d4bea00086c8b1f",
    "purchase_order_name": "PRO Plan",
    "customer_info": {
      "name": "Test User",
      "email": "test@example.com",
      "phone": "98xxxxxxxx"
    },
    "amount_breakdown": [...]
  }
}
```

**Verify in Database:**
```bash
python manage.py shell
>>> from apps.billing.models import PaymentTransaction
>>> pt = PaymentTransaction.objects.latest('created_at')
>>> print(f"Status: {pt.status}")
>>> print(f"Plan: {pt.plan.name}")
>>> print(f"Amount: {pt.amount}")
```

**Expected:**
```
Status: INITIATED
Plan: PRO
Amount: 3900
```

### 5.4 Test: POST /billing/khalti/verify/ (Simulated)

> 💡 **Note:** For real testing, you need to complete Khalti payment first.
> For now, we'll test with a mock token.

```bash
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "token": "test_token_xxxxx",
    "transaction_id": "test_tx_xxxxx",
    "payment_id": "PAYMENT_ID_FROM_INIT"
  }'
```

**Expected Response on Success (200 OK):**
```json
{
  "status": "success",
  "plan": "PRO",
  "message": "Plan activated successfully",
  "subscription": {
    "plan": "PRO",
    "start_date": "2026-02-06",
    "end_date": "2026-03-08",
    "is_active": true
  }
}
```

**Expected Response on Failure (400 Bad Request):**
```json
{
  "status": "failed",
  "error": "Payment verification failed",
  "message": "Invalid token or transaction ID"
}
```

### 5.5 Verify Backend After Payment Success

```bash
python manage.py shell
>>> from apps.core.models import Organization
>>> org = Organization.objects.get(name='Test Org')
>>> 
>>> # Check subscription updated
>>> print(f"Plan: {org.subscription.plan.name}")  # Should be PRO
>>> 
>>> # Check usage reset
>>> print(f"Invoices created: {org.usage.invoices_created}")  # Should be 0
>>> 
>>> # Check payment transaction
>>> pt = org.payment_transactions.latest('created_at')
>>> print(f"Status: {pt.status}")  # Should be SUCCESS
>>> print(f"Amount: {pt.amount}")  # Should be 3900
```

**Expected:**
```
Plan: PRO
Invoices created: 0
Status: SUCCESS
Amount: 3900
```

---

## 🛡️ STEP 6: ERROR HANDLING TEST (5 minutes)

### 6.1 Test: Over Limit Error

Create 10 invoices on FREE plan, then try to create 11th via API:

```bash
# First, in Django shell, create 10 invoices
python manage.py shell
>>> org = Organization.objects.get(name='Test Org')
>>> org.usage.invoices_created = 10
>>> org.usage.save()
```

Then simulate API call that would create invoice (you need to add decorator to your endpoint):

```bash
# This would be your invoice creation endpoint
# For now, test the limit check directly:
python manage.py shell
>>> from apps.billing.decorators import check_invoice_limit
>>> org = Organization.objects.get(name='Test Org')
>>> org.usage.can_create_invoice()
# Should return: False
```

**Expected:** Function returns False, decorator would return 403 Forbidden

### 6.2 Test: Missing Authentication

```bash
curl -X GET http://localhost:8000/billing/usage/
# No Authorization header
```

**Expected Response (401 Unauthorized):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 6.3 Test: Invalid Token

```bash
curl -X GET http://localhost:8000/billing/usage/ \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected Response (401 Unauthorized):**
```json
{
  "detail": "Given token is invalid for any token type"
}
```

---

## 💰 STEP 7: FULL PAYMENT FLOW TEST (10 minutes)

### 7.1 Initiate Payment
```bash
curl -X POST http://localhost:8000/billing/khalti/init/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{"plan": "PRO", "amount": 3900}'

# Response: {"payment_id": "...", "payload": {...}}
```

### 7.2 Get Khalti Payment URL

Use the payload to construct Khalti payment URL (or manually test with Khalti sandbox)

> 💡 **To test with real Khalti:**
> 1. Go to Khalti test merchant dashboard
> 2. Get test card credentials
> 3. Complete payment in Khalti test mode

### 7.3 Verify Payment

After completing payment in Khalti:

```bash
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "token": "KHALTI_TOKEN_FROM_PAYMENT",
    "transaction_id": "KHALTI_TRANSACTION_ID",
    "payment_id": "PAYMENT_ID_FROM_INIT"
  }'

# Response: {"status": "success", "plan": "PRO", ...}
```

### 7.4 Verify Database State

```bash
python manage.py shell
>>> org = Organization.objects.get(name='Test Org')
>>> print(f"Plan: {org.subscription.plan.name}")  # PRO ✅
>>> print(f"Is Active: {org.subscription.is_active}")  # True ✅
>>> print(f"Invoices Reset: {org.usage.invoices_created}")  # 0 ✅
>>> print(f"End Date: {org.subscription.end_date}")  # +30 days ✅
```

---

## 📋 FINAL VERIFICATION CHECKLIST

- [ ] Migrations applied successfully
- [ ] 15 plan limits initialized
- [ ] Admin interface showing all models
- [ ] Khalti keys configured in .env
- [ ] Test org created successfully
- [ ] FREE plan limit = 10 ✅
- [ ] BASIC plan limit = 1,000 ✅
- [ ] PRO plan limit = unlimited ✅
- [ ] /billing/usage/ endpoint returns correct data
- [ ] /billing/khalti/init/ endpoint returns payment_id
- [ ] /billing/khalti/verify/ endpoint verifies payment
- [ ] Payment updates subscription correctly
- [ ] Usage counters reset after payment
- [ ] Over-limit returns 403 error
- [ ] Missing auth returns 401 error
- [ ] Admin can manage plan limits

---

## ✅ SUCCESS CRITERIA

**All scenarios must PASS:**

- ✅ Setup completed without errors
- ✅ Configuration loaded correctly
- ✅ Admin interface fully functional
- ✅ Plan limits enforced correctly
- ✅ API endpoints responding
- ✅ Payment flow working
- ✅ Error handling proper
- ✅ Database state correct

---

## 📝 DOCUMENT YOUR RESULTS

Use this template:

```
DAY 9 TESTING RESULTS
Date: ___________
Tester: ___________

✅ SETUP
  - Migrations: PASS / FAIL
  - Plan limits initialized: PASS / FAIL
  - Configuration: PASS / FAIL

✅ PLAN LIMITS
  - FREE (10): PASS / FAIL
  - BASIC (1000): PASS / FAIL
  - PRO (unlimited): PASS / FAIL

✅ API ENDPOINTS
  - GET /billing/usage/: PASS / FAIL
  - POST /billing/khalti/init/: PASS / FAIL
  - POST /billing/khalti/verify/: PASS / FAIL

✅ ADMIN INTERFACE
  - Plan limits: PASS / FAIL
  - Usages: PASS / FAIL
  - Payments: PASS / FAIL
  - Subscriptions: PASS / FAIL

✅ ERROR HANDLING
  - Missing auth (401): PASS / FAIL
  - Invalid token (401): PASS / FAIL
  - Over limit (403): PASS / FAIL

✅ PAYMENT FLOW
  - Initiate: PASS / FAIL
  - Verify: PASS / FAIL
  - Database update: PASS / FAIL

OVERALL: PASS ✅ / NEEDS FIXES ❌

Issues Found:
(List any issues here)

Next Steps:
(What to do next)
```

---

## 🎉 AFTER TESTING PASSES

1. **Commit to Git:**
   ```bash
   git add .
   git commit -m "Day 9: Complete payment processing & plan enforcement"
   git push
   ```

2. **Post on LinkedIn:**
   - See LINKEDIN_DAY9_POSTS.md
   - Pick a version you like
   - Post with Day 9 updates

3. **Start Day 10:**
   - Email notifications
   - User payment dashboard
   - Invoice downloads

---

**Expected Total Time: 60-90 minutes**

**Ready? Let's test! 🚀**
