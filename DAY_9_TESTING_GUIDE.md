# 🧪 DAY 9 COMPLETE TESTING GUIDE

## ✅ PRE-TESTING CHECKLIST

Before running any tests, ensure:
- [ ] Migrations applied: `python manage.py migrate`
- [ ] Plan limits initialized: `python manage.py init_plan_limits`
- [ ] Khalti keys in .env: `KHALTI_PUBLIC_KEY` & `KHALTI_SECRET_KEY`
- [ ] Server running: `python manage.py runserver`
- [ ] Admin user created: `python manage.py createsuperuser`

---

## 🎯 TESTING SCENARIO 1: Plan Limits Enforcement

### Test 1.1: FREE Plan Limit (10 invoices)

**Setup:**
```bash
python manage.py shell
>>> from apps.core.models import Organization
>>> from apps.billing.models import Subscription, Usage, Plan
>>> from django.contrib.auth import get_user_model
>>> 
>>> User = get_user_model()
>>> user = User.objects.create_user(email='test@example.com', password='123456')
>>> org = Organization.objects.create(user=user, name='Test Org')
>>> free_plan = Plan.objects.get(name='FREE')
>>> Subscription.objects.create(organization=org, plan=free_plan)
>>> usage = Usage.objects.create(organization=org)
```

**Test Case 1:**
```bash
# In Django shell
>>> org = Organization.objects.get(name='Test Org')
>>> usage = org.usage
>>> 
>>> # Create 10 invoices (should succeed)
>>> for i in range(10):
...     usage.invoices_created += 1
...     usage.save()
...     print(f"Invoice {i+1} created. Can create more: {usage.can_create_invoice()}")
...
>>> # Try to create 11th (should fail)
>>> usage.invoices_created += 1
>>> usage.save()
>>> print(f"Can create invoice 11? {usage.can_create_invoice()}")  # Should be False
```

**Expected Output:**
```
Invoice 1 created. Can create more: True
Invoice 2 created. Can create more: True
...
Invoice 10 created. Can create more: True
Can create invoice 11? False  ✅
```

---

### Test 1.2: BASIC Plan Limit (1,000 invoices)

**Setup:**
```bash
>>> from apps.billing.models import Plan
>>> basic_plan = Plan.objects.get(name='BASIC')
>>> subscription = org.subscription
>>> subscription.plan = basic_plan
>>> subscription.save()
>>> usage.invoices_created = 0
>>> usage.save()
```

**Test Case:**
```bash
>>> # Should allow 1,000 invoices
>>> for i in range(1000):
...     usage.invoices_created += 1
...     usage.save()
...     if (i + 1) % 100 == 0:
...         print(f"{i+1} invoices, Can create more: {usage.can_create_invoice()}")
...
>>> # 11th should fail
>>> usage.invoices_created += 1
>>> usage.save()
>>> print(f"Can create invoice 1001? {usage.can_create_invoice()}")  # Should be False
```

**Expected Output:**
```
100 invoices, Can create more: True
200 invoices, Can create more: True
...
1000 invoices, Can create more: True
Can create invoice 1001? False  ✅
```

---

### Test 1.3: PRO Plan (Unlimited)

**Setup:**
```bash
>>> pro_plan = Plan.objects.get(name='PRO')
>>> subscription.plan = pro_plan
>>> subscription.save()
>>> usage.invoices_created = 9999
>>> usage.save()
```

**Test Case:**
```bash
>>> # Should allow unlimited
>>> usage.invoices_created = 10000
>>> usage.save()
>>> print(f"Can create invoice 10000? {usage.can_create_invoice()}")  # Should be True
>>> 
>>> usage.invoices_created = 99999
>>> usage.save()
>>> print(f"Can create invoice 99999? {usage.can_create_invoice()}")  # Should be True
```

**Expected Output:**
```
Can create invoice 10000? True  ✅
Can create invoice 99999? True  ✅
```

---

## 🎯 TESTING SCENARIO 2: API Endpoint Limits

### Test 2.1: Khalti Init Endpoint

**Request:**
```bash
curl -X POST http://localhost:8000/billing/khalti/init/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "plan": "PRO",
    "amount": 3900
  }'
```

**Expected Response (200 OK):**
```json
{
  "payment_id": "61de7e7b6d4bea00086c8b1f",
  "status": "INITIATED",
  "payload": {
    "return_url": "http://localhost:8000/billing/khalti/callback/",
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

**Success Criteria:** ✅
- Returns 200 OK
- Contains payment_id
- Contains payload with purchase_order_id
- PaymentTransaction created in database

---

### Test 2.2: Khalti Verify Endpoint

**Request:**
```bash
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "token": "test_token_from_khalti",
    "transaction_id": "test_transaction_id",
    "payment_id": "61de7e7b6d4bea00086c8b1f"
  }'
```

**Expected Response (200 OK):**
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

**Success Criteria:** ✅
- Returns 200 OK
- PaymentTransaction status updated to SUCCESS
- Subscription plan updated
- Usage counters reset to 0
- Plan end_date set to 30 days from now

---

### Test 2.3: Usage Check Endpoint

**Request:**
```bash
curl -X GET http://localhost:8000/billing/usage/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "current_plan": "PRO",
  "organization": "Test Org",
  "usage": {
    "invoices_created": 0,
    "invoices_limit": 999999,
    "invoices_remaining": 999999,
    "invoices_percentage": 0
  },
  "customers": {
    "created": 0,
    "limit": 999999,
    "remaining": 999999,
    "percentage": 0
  },
  "team_members": {
    "added": 0,
    "limit": 999999,
    "remaining": 999999,
    "percentage": 0
  }
}
```

**Success Criteria:** ✅
- Returns 200 OK
- Shows current plan
- Shows all limits and usage
- Shows percentage filled

---

## 🎯 TESTING SCENARIO 3: Admin Interface

### Test 3.1: Plan Limits Admin

**Steps:**
1. Go to http://localhost:8000/admin/
2. Login with admin credentials
3. Click "Billing" → "Plan limits"

**Expected:** ✅
- See 15 plan limit records
- See columns: Plan, Feature, Limit Value
- Can filter by Plan (FREE, BASIC, PRO)
- Can search by Feature name
- Can click to edit limits

**Test Edit:**
1. Click any limit record
2. Change limit value
3. Click Save
4. Go back to list
5. Verify change saved

---

### Test 3.2: Usage Admin

**Steps:**
1. Go to http://localhost:8000/admin/
2. Click "Billing" → "Usages"

**Expected:** ✅
- See all organizations' usage
- See columns: Organization, Invoices, Customers, Team Members, Last Updated
- Can filter by organization
- Can view usage details by clicking

---

### Test 3.3: Payment Transactions Admin

**Steps:**
1. Go to http://localhost:8000/admin/
2. Click "Billing" → "Payment transactions"

**Expected:** ✅
- See all payment transactions
- See columns: Organization, Plan, Amount, Status, Provider, Created At
- Can filter by Status (SUCCESS, FAILED, PENDING)
- Can filter by Provider (KHALTI, ESEWA)
- Can search by reference_id

---

### Test 3.4: Subscriptions Admin

**Steps:**
1. Go to http://localhost:8000/admin/
2. Click "Billing" → "Subscriptions"

**Expected:** ✅
- See all subscriptions
- See columns: Organization, Plan, Is Active, Start Date, End Date
- Can filter by Plan
- Can filter by Is Active (True/False)
- Can click to edit plan (for testing)

---

## 🎯 TESTING SCENARIO 4: API Decorator Enforcement

### Test 4.1: Invoice Limit Decorator

**Setup:**
```python
# In your views.py, add decorator to create_invoice endpoint
from apps.billing.decorators import check_invoice_limit

@api_view(['POST'])
@check_invoice_limit
def create_invoice(request):
    # Your invoice creation logic
    return Response({"status": "invoice created"})
```

**Test Case 1: FREE plan at limit**
```bash
# Setup: Organization with FREE plan, 10 invoices created
curl -X POST http://localhost:8000/api/invoices/ \
  -H "Authorization: Bearer TOKEN" \
  -d '{...invoice data...}'
```

**Expected Response (403 Forbidden):**
```json
{
  "status": "limit_reached",
  "error": "Reached invoice limit (10). Upgrade your plan to create more invoices.",
  "current_usage": 10,
  "limit": 10,
  "plan": "FREE",
  "upgrade_url": "/billing/upgrade/"
}
```

**Success Criteria:** ✅
- Returns 403 Forbidden
- Clear error message
- Shows current usage vs limit
- Suggests upgrade

---

### Test 4.2: Customer Limit Decorator

**Similar to Test 4.1 but for customers**

**Expected:**
- If BASIC plan, 50 customer limit
- If PRO plan, unlimited
- Same 403 response format
- Clear upgrade message

---

### Test 4.3: Team Member Limit Decorator

**Similar to Test 4.1 but for team members**

**Expected:**
- If FREE plan, 1 member limit
- If BASIC plan, 3 members limit
- If PRO plan, unlimited
- Same 403 response format

---

## 🎯 TESTING SCENARIO 5: Payment Flow (End-to-End)

### Step 1: User initiates upgrade from FREE to PRO
```bash
POST /billing/khalti/init/
{
  "plan": "PRO",
  "amount": 3900,
  "return_url": "http://localhost:3000/billing/success/"
}

Response:
{
  "payment_id": "abc123",
  "status": "INITIATED",
  "payload": {...}
}
```

### Step 2: Khalti redirect
- User redirected to Khalti payment page
- Khalti shows payment screen
- User enters test card details (Khalti provides test numbers)

### Step 3: Payment completion
- User completes payment
- Khalti redirects to /billing/khalti/callback/?token=xxx&transaction_id=xxx

### Step 4: Callback verification
```
GET /billing/khalti/callback/?token=xxx&transaction_id=xxx

Response:
Redirects to /billing/success/ with message "Plan upgraded to PRO"
```

### Step 5: Verify backend
```bash
python manage.py shell
>>> org = Organization.objects.get(name='Test Org')
>>> org.subscription.plan.name  # Should be 'PRO'
>>> org.usage.invoices_created  # Should be 0 (reset)
>>> org.payment_transactions.filter(status='SUCCESS').count()  # Should be 1
```

**Success Criteria:** ✅
- Payment initiated
- User redirected to Khalti
- Payment verified
- Plan activated
- Usage reset
- Database updated

---

## 🎯 TESTING SCENARIO 6: Failed Payment Handling

### Test 6.1: Invalid Token

**Request:**
```bash
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid_token",
    "transaction_id": "invalid_id",
    "payment_id": "abc123"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "failed",
  "error": "Payment verification failed",
  "message": "Invalid token or transaction ID"
}
```

**Success Criteria:** ✅
- Returns 400 Bad Request
- PaymentTransaction status set to FAILED
- Plan NOT activated
- Usage NOT reset

---

### Test 6.2: Amount Mismatch

**Request:**
```bash
# Initiates payment for 3900
# But verifies with different amount
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "valid_token",
    "transaction_id": "valid_id",
    "payment_id": "abc123",
    "amount": 5000
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "status": "failed",
  "error": "Amount mismatch",
  "expected_amount": 3900,
  "received_amount": 5000
}
```

**Success Criteria:** ✅
- Detects amount mismatch
- Prevents plan activation
- Logs error for audit

---

## 📋 COMPLETE TEST CHECKLIST

### Database & Models
- [ ] 15 PlanLimit records created
- [ ] Usage table stores counters correctly
- [ ] PaymentTransaction records created on payment init
- [ ] Subscription updated on successful payment

### Admin Interface
- [ ] Can view all PlanLimit records (15 total)
- [ ] Can edit limit values
- [ ] Can filter by plan
- [ ] Can view usage analytics
- [ ] Can see payment history
- [ ] Can view subscription status

### API Endpoints
- [ ] POST /billing/khalti/init/ returns 200
- [ ] POST /billing/khalti/verify/ returns 200 on success
- [ ] POST /billing/khalti/verify/ returns 400 on failure
- [ ] GET /billing/khalti/callback/ redirects correctly
- [ ] GET /billing/usage/ returns current usage

### Plan Enforcement
- [ ] FREE plan limits to 10 invoices
- [ ] BASIC plan limits to 1,000 invoices
- [ ] PRO plan allows unlimited
- [ ] Limits enforced at model level (can_create_invoice())
- [ ] Limits enforced at API level (@check_invoice_limit)
- [ ] Customer limit enforced
- [ ] Team member limit enforced

### Payment Flow
- [ ] Payment initiation creates PaymentTransaction
- [ ] Khalti verification updates status to SUCCESS
- [ ] Failed verification sets status to FAILED
- [ ] Successful payment activates plan
- [ ] Usage reset after plan activation
- [ ] Subscription end_date set correctly (30 days)

### Error Handling
- [ ] Invalid token returns 400
- [ ] Amount mismatch returns 400
- [ ] Missing parameters returns 400
- [ ] Unauthorized access returns 401
- [ ] Organization not found returns 404

### Security
- [ ] API keys not exposed in responses
- [ ] CSRF protection enabled
- [ ] JWT authentication working
- [ ] Rate limiting prevents abuse
- [ ] Transaction data encrypted

---

## 🚀 RUNNING TESTS (Automated)

```bash
# Create test file: tests.py
python manage.py test apps.billing

# With verbosity
python manage.py test apps.billing -v 2

# Specific test
python manage.py test apps.billing.tests.PlanLimitTestCase
```

---

## 🔍 DEBUGGING TIPS

### If limits not enforcing:
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit
>>> PlanLimit.objects.filter(plan__name='FREE').values('feature', 'limit_value')
# Should show: invoices→10, customers→5, team_members→1
```

### If payment not initiating:
```bash
>>> from apps.billing.payment_gateway import KhaltiPaymentManager
>>> khalti = KhaltiPaymentManager()
>>> khalti.initiate_payment(amount=3900)
# Should return success response with payload
```

### If usage not resetting:
```bash
>>> org.usage.invoices_created  # Check before
>>> payment_txn.activate_plan()
>>> org.usage.refresh_from_db()
>>> org.usage.invoices_created  # Should be 0
```

### If admin showing errors:
```bash
# Check admin.py registrations
python manage.py shell
>>> from apps.billing.admin import PlanLimitAdmin
>>> PlanLimitAdmin  # Should load without errors
```

---

## ✅ SUCCESS CRITERIA

All tests pass when:
✅ All 15 plan limits initialized
✅ Usage counters update correctly
✅ Decorators block over-limit requests
✅ Khalti endpoints respond correctly
✅ Payment verification works
✅ Plan activation automatic
✅ Admin interface full functional
✅ Error handling comprehensive
✅ Security measures in place

**Everything is complete and ready for testing!**

---

## 📊 Test Results Template

Use this template to document your testing:

```
DAY 9 TESTING RESULTS
Date: ___________
Tester: ___________

Scenario 1: Plan Limits
  Test 1.1: FREE (10 invoices) - [ ] PASS [ ] FAIL
  Test 1.2: BASIC (1000 invoices) - [ ] PASS [ ] FAIL
  Test 1.3: PRO (unlimited) - [ ] PASS [ ] FAIL

Scenario 2: API Endpoints
  Test 2.1: Khalti Init - [ ] PASS [ ] FAIL
  Test 2.2: Khalti Verify - [ ] PASS [ ] FAIL
  Test 2.3: Usage Check - [ ] PASS [ ] FAIL

Scenario 3: Admin Interface
  Test 3.1: Plan Limits Admin - [ ] PASS [ ] FAIL
  Test 3.2: Usage Admin - [ ] PASS [ ] FAIL
  Test 3.3: Payment Admin - [ ] PASS [ ] FAIL
  Test 3.4: Subscription Admin - [ ] PASS [ ] FAIL

Scenario 4: Decorators
  Test 4.1: Invoice Limit - [ ] PASS [ ] FAIL
  Test 4.2: Customer Limit - [ ] PASS [ ] FAIL
  Test 4.3: Team Member Limit - [ ] PASS [ ] FAIL

Scenario 5: Payment Flow
  Full E2E Payment - [ ] PASS [ ] FAIL

Scenario 6: Error Handling
  Invalid Token - [ ] PASS [ ] FAIL
  Amount Mismatch - [ ] PASS [ ] FAIL

Overall Status: [ ] READY FOR PRODUCTION [ ] NEEDS FIXES
```

---

**Happy Testing! 🎉**
