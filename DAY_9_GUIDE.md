# DAY 9: PAYMENT INTEGRATION & PLAN ENFORCEMENT - IMPLEMENTATION GUIDE

## ✅ What Was Added

### 1. **Plan Limit System** (`models.py`)
- `PlanLimit` model - Define feature limits per plan
- Enhanced `Usage` model with limit checking methods
- Plan enforcement logic with error messages

### 2. **Payment Gateway Integration** (`payment_gateway.py`)
- `KhaltiPaymentManager` class
- `ESewaPaymentManager` class
- Payment verification logic

### 3. **Decorators for Enforcement** (`decorators.py`)
- `@check_invoice_limit` - Prevent invoice creation beyond limit
- `@check_customer_limit` - Prevent customer creation beyond limit
- `@check_team_member_limit` - Prevent team member addition beyond limit

### 4. **Khalti Payment Views** (`views.py`)
- `KhaltiInitPaymentView` - Initiate payment
- `khalti_verify_payment` - Verify payment and activate plan
- `khalti_callback` - Handle redirect from Khalti

### 5. **Configuration** (`settings.py`)
- Khalti API keys (PUBLIC_KEY, SECRET_KEY)
- eSewa configuration

---

## 🚀 IMPLEMENTATION STEPS

### **Step 1: Run Migrations**
```bash
cd /home/samir/Multi-Tenant\ SaaS
python manage.py makemigrations
python manage.py migrate
```

### **Step 2: Create .env Variables**
```bash
# Add to .env file
KHALTI_PUBLIC_KEY=your_khalti_public_key
KHALTI_SECRET_KEY=your_khalti_secret_key
ESEWA_MERCHANT_SECRET=your_esewa_secret
```

**Get these from:**
- Khalti: https://dashboard.khalti.com
- eSewa: https://merchant.esewa.com.np

### **Step 3: Initialize Plan Limits**
```bash
python manage.py init_plan_limits
```

This creates limits for all 3 plans:
- **FREE**: 10 invoices, 5 customers, 1 team member
- **BASIC**: 1,000 invoices, 50 customers, 3 team members  
- **PRO**: Unlimited everything

---

## 🧪 TESTING THE PAYMENT FLOW

### **1. Test Plan Enforcement**

Open Django shell:
```bash
python manage.py shell
```

```python
from apps.billing.models import Usage, Subscription, Organization
from apps.core.models import Organization as Org

# Get an organization
org = Org.objects.first()

# Get or create usage
usage, _ = Usage.objects.get_or_create(organization=org)

# Create subscription
sub, _ = Subscription.objects.get_or_create(organization=org, defaults={'plan': 'FREE'})

# Test invoice limit check
can_create, msg = usage.can_create_invoice()
print(f"Can create invoice: {can_create}, Message: {msg}")

# Try to increment beyond limit
for i in range(12):
    success = usage.increment_invoice_count()
    print(f"Invoice {i+1}: {success}")
```

### **2. Test Khalti Payment Flow**

**Request:** POST `/billing/khalti/init/`
```json
{
    "plan": "PRO"
}
```

**Response:**
```json
{
    "payment_id": 1,
    "api_url": "https://khalti.com/api/v2/epayment/initiate/",
    "payload": {
        "public_key": "...",
        "transaction_uuid": "...",
        "amount": 1390000,
        "product_name": "Upgrade to PRO Plan"
    }
}
```

Then verify payment:
**Request:** POST `/billing/khalti/verify/`
```json
{
    "token": "khalti_token_from_payment",
    "transaction_id": "txn_xxx",
    "payment_id": 1
}
```

### **3. Test API Endpoint with Limit**

**Request:** GET `/api/invoices/` (assuming this endpoint exists)

If organization has hit invoice limit, returns:
```json
{
    "error": "Reached invoice limit (10). Upgrade your plan.",
    "current": 10,
    "limit": 10,
    "plan": "FREE"
}
```

---

## 📋 CHECKLIST FOR DAY 9

- [ ] Run migrations
- [ ] Add `.env` variables for Khalti/eSewa
- [ ] Run `init_plan_limits` command
- [ ] Test plan enforcement in shell
- [ ] Test Khalti payment initiation
- [ ] Test plan activation after payment
- [ ] Verify usage limits are enforced
- [ ] Test admin interface for plan management

---

## 🔗 USAGE IN YOUR CODE

### **Enforcing Invoice Creation Limits**

In your invoice creation view:
```python
from apps.billing.decorators import check_invoice_limit

@check_invoice_limit
def create_invoice(request):
    # Your invoice creation logic
    serializer = InvoiceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(organization=request.organization)
        request.organization.usage.increment_invoice_count()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)
```

### **Checking Limits in Views**

```python
from rest_framework.response import Response
from rest_framework import status

def my_view(request):
    usage = request.organization.usage
    
    # Check invoice limit
    can_create, msg = usage.can_create_invoice()
    if not can_create:
        return Response({"error": msg}, status=status.HTTP_403_FORBIDDEN)
    
    # Proceed with business logic
    ...
```

### **Managing Plans in Admin**

1. Go to `/admin/billing/planlimit/`
2. View/edit limits for each plan
3. Limits are immediately enforced

---

## ⚠️ IMPORTANT NOTES

1. **Payment Gateway Keys**: 
   - Use TEST keys in development
   - Switch to PRODUCTION keys before going live
   - Never commit API keys to Git

2. **Khalti Verification**:
   - Only call verify after user completes payment
   - Store transaction IDs for reconciliation
   - Handle failed verifications gracefully

3. **Subscription Expiry**:
   - Currently plans are valid for 30 days
   - Edit `timedelta(days=30)` in `activate_plan()` to change
   - Consider adding renewal logic for recurring subscriptions

4. **Usage Reset**:
   - Monthly limits reset on subscription renewal
   - Adjust `reset_monthly_limits()` call timing as needed

---

## 🎯 NEXT STEPS (Day 10)

- [ ] Add email notifications on successful payment
- [ ] Create payment history page
- [ ] Add Stripe integration for international payments
- [ ] Implement plan downgrade logic
- [ ] Add usage analytics dashboard

---

## 📞 TESTING WITH KHALTI

**Khalti Test Merchant:**
- Public Key: `test_public_key_xxxxx` (get from Khalti dashboard)
- Secret Key: `test_secret_key_xxxxx`

**Test Card Numbers:**
- Use any number while testing (it's a merchant simulator)
- Actual cards work after production approval

---

## 🐛 TROUBLESHOOTING

**Issue: "PlanLimit matching query does not exist"**
```bash
python manage.py init_plan_limits  # Re-run this
```

**Issue: "KHALTI keys not configured"**
- Check `.env` file has keys
- Verify settings.py loads from `.env`
- Restart Django server

**Issue: Payment not activating plan**
- Check `PaymentTransaction` status in admin
- Verify webhook URL is correct
- Check Khalti test merchant dashboard for transaction logs

---

**🎉 Day 9 is ready! Your SaaS now has real payment processing and plan enforcement.**
