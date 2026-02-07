# DAY 9 MIGRATION & DEPLOYMENT GUIDE

## 🔄 DATABASE MIGRATION STEPS

### Step 1: Create Migrations
```bash
cd /home/samir/Multi-Tenant\ SaaS
python manage.py makemigrations
```

**Output should show:**
```
Migrations for 'billing':
  apps/billing/migrations/000X_initial.py
    - Create model PlanLimit
    - Add field customers_created to usage
    - Add field team_members_added to usage
    - Add field api_calls_used to usage
    - Add method activate_plan to paymenttransaction
```

### Step 2: Review Migrations
```bash
python manage.py sqlmigrate billing 000X
```

This shows the SQL that will be executed.

### Step 3: Apply Migrations
```bash
python manage.py migrate
```

**Expected output:**
```
Running migrations:
  Applying billing.000X_initial... OK
```

### Step 4: Create Fixtures (Optional)
Create plan limits:
```bash
python manage.py init_plan_limits
```

**Output:**
```
✓ Created: FREE - invoices: 10
✓ Created: FREE - customers: 5
✓ Created: BASIC - invoices: 1000
... (more plan limits)
✓ Successfully initialized X new plan limits
```

---

## ⚙️ SETTINGS CONFIGURATION

### 1. Update `.env` File
```bash
# Payment Gateway Configuration
KHALTI_PUBLIC_KEY=test_public_key_xxxxx
KHALTI_SECRET_KEY=test_secret_key_xxxxx
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_MERCHANT_SECRET=your_secret_here
```

### 2. Get Khalti Keys
1. Visit https://dashboard.khalti.com
2. Sign up as merchant
3. Get TEST keys first (for development)
4. Use LIVE keys in production

### 3. Update Production Settings
When going live:
```python
# config/settings.py

KHALTI_PUBLIC_KEY = os.getenv("KHALTI_PUBLIC_KEY")  # Use LIVE key
KHALTI_SECRET_KEY = os.getenv("KHALTI_SECRET_KEY")  # Use LIVE key
KHALTI_CALLBACK_URL = "https://yourdomain.com/billing/khalti/callback/"
```

---

## 🧪 POST-MIGRATION TESTING

### Test 1: Verify Models Exist
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit, Usage, PaymentTransaction
>>> PlanLimit.objects.count()  # Should be ~15
>>> Usage.objects.count()      # Existing orgs should have usage records
```

### Test 2: Verify Plan Limits
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit
>>> free_plan = PlanLimit.objects.filter(plan='FREE')
>>> free_plan.count()
5  # Should have 5 features for FREE plan
>>> free_plan.first()
<PlanLimit: FREE - invoices: 10>
```

### Test 3: Test Usage Methods
```bash
python manage.py shell
>>> from apps.billing.models import Usage
>>> usage = Usage.objects.first()
>>> can_create, msg = usage.can_create_invoice()
>>> print(f"Can create: {can_create}, Message: {msg}")
```

### Test 4: API Endpoint
```bash
curl -X GET http://localhost:8000/billing/usage/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return:
```json
{
    "invoices_created": 0,
    "customers_created": 0,
    ...
}
```

---

## 📋 DEPLOYMENT CHECKLIST

### Before Going Live

- [ ] All migrations applied successfully
- [ ] PlanLimit data initialized with `init_plan_limits`
- [ ] `.env` file has production API keys
- [ ] KHALTI_PUBLIC_KEY and KHALTI_SECRET_KEY set
- [ ] HTTPS enabled on all payment endpoints
- [ ] PaymentTransaction webhook tested
- [ ] Database backups configured
- [ ] Error logging configured
- [ ] Admin panel access restricted
- [ ] Rate limiting on payment endpoints

### Production Environment Variables
```bash
# .env (Production)
DEBUG=False
SECRET_KEY=your_secret_key_here

# Payment Gateway - LIVE KEYS
KHALTI_PUBLIC_KEY=live_public_key_xxxxx
KHALTI_SECRET_KEY=live_secret_key_xxxxx

# eSewa - LIVE
ESEWA_MERCHANT_CODE=YOUR_LIVE_MERCHANT_CODE
ESEWA_MERCHANT_SECRET=your_live_secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

### Deployment Steps (Production)
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
pip install -r requirements.txt

# 3. Collect static files
python manage.py collectstatic --noinput

# 4. Run migrations
python manage.py migrate

# 5. Create cache tables
python manage.py createcachetable

# 6. Restart application
systemctl restart gunicorn_multitenancy
systemctl restart nginx

# 7. Verify
curl https://yourdomain.com/billing/usage/
```

---

## 🚨 ROLLBACK PROCEDURE

If something goes wrong:

### Rollback Last Migration
```bash
python manage.py migrate billing 000X  # Go back one version
```

### Check Migration Status
```bash
python manage.py showmigrations billing
```

### Reset Specific Model Data (Development Only)
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit
>>> PlanLimit.objects.all().delete()
```

Then re-run:
```bash
python manage.py init_plan_limits
```

---

## 🔍 VERIFICATION COMMANDS

### Check Database Schema
```bash
python manage.py sqlmigrate billing 000X  # View SQL
python manage.py inspectdb > models.txt   # Export schema
```

### Verify Data Integrity
```bash
python manage.py shell
>>> from apps.billing.models import Usage, Subscription
>>> for usage in Usage.objects.all():
...     if not usage.organization.subscription:
...         print(f"Missing subscription for {usage.organization}")
```

### Count Records
```bash
python manage.py shell
>>> from apps.billing.models import PlanLimit, Usage, PaymentTransaction
>>> print(f"Plan Limits: {PlanLimit.objects.count()}")
>>> print(f"Usage Records: {Usage.objects.count()}")
>>> print(f"Payments: {PaymentTransaction.objects.count()}")
```

---

## 📊 DATABASE STATISTICS

### Expected Size After Day 9
```
Table              Records (approx)  Size
─────────────────────────────────────────
PlanLimit          15                ~5 KB
Usage              100s              ~100 KB
PaymentTransaction 10s-100s          ~50-500 KB
Subscription       100s              ~100 KB
─────────────────────────────────────────
Total                                ~250 KB
```

For 1000 organizations:
```
Table              Records           Size
─────────────────────────────────────────
Usage              1,000             ~1 MB
Subscription       1,000             ~1 MB
PaymentTransaction 5,000-10,000      ~5-10 MB
─────────────────────────────────────────
Total                                ~7-12 MB
```

---

## 🔐 SECURITY CONSIDERATIONS

### API Key Management
✅ Store in `.env` file (not in code)
✅ Rotate keys quarterly
✅ Use separate keys for test and production
✅ Never log full API keys
✅ Use environment-specific values

### Payment Verification
✅ Always verify token with Khalti
✅ Match amount before activation
✅ Log all payment attempts
✅ Implement rate limiting
✅ Monitor for suspicious patterns

### Data Protection
✅ Encrypt sensitive fields (optional)
✅ Use HTTPS for all endpoints
✅ Implement CSRF protection
✅ Validate all user inputs
✅ Regular security audits

---

## 📈 PERFORMANCE OPTIMIZATION

### Database Indexes
Auto-created on primary keys and foreign keys.

Consider adding:
```python
# In models.py
class Usage(models.Model):
    ...
    class Meta:
        indexes = [
            models.Index(fields=['organization', 'updated_at']),
        ]
```

### Query Optimization
```python
# Bad: N+1 queries
for usage in Usage.objects.all():
    print(usage.organization.subscription.plan)

# Good: Prefetch related
Usage.objects.select_related('organization__subscription')
```

### Caching
```python
# Cache plan limits (they don't change often)
from django.core.cache import cache

def get_plan_limit(plan, feature):
    key = f"plan_limit_{plan}_{feature}"
    value = cache.get(key)
    if not value:
        value = PlanLimit.objects.get(plan=plan, feature=feature).limit_value
        cache.set(key, value, 86400)  # Cache for 24 hours
    return value
```

---

## 📞 TROUBLESHOOTING

### Migration Errors

**Error: "relation 'billing_planlimit' does not exist"**
```bash
# Solution: Ensure migrations are applied
python manage.py migrate billing
```

**Error: "PlanLimit matching query does not exist"**
```bash
# Solution: Initialize plan limits
python manage.py init_plan_limits
```

**Error: "duplicate key value violates unique constraint"**
```bash
# Solution: Run migrations with fake flag
python manage.py migrate --fake-initial
python manage.py migrate
```

### API Errors

**Error: 500 - "KHALTI_PUBLIC_KEY not set"**
```bash
# Solution: Add to .env and restart
echo "KHALTI_PUBLIC_KEY=xxx" >> .env
python manage.py runserver
```

**Error: 403 - "Organization not found"**
```bash
# This means the middleware isn't setting request.organization
# Check apps/core/middleware.py and ensure it's installed
```

---

## ✅ FINAL CHECKLIST

- [ ] All migrations created
- [ ] All migrations applied without errors
- [ ] PlanLimit table has 15 records
- [ ] Usage table initialized for existing orgs
- [ ] `.env` file updated with Khalti keys
- [ ] Admin interface accessible
- [ ] Khalti endpoints responding
- [ ] Payment flow tested end-to-end
- [ ] Usage limits enforced
- [ ] Error messages displayed correctly
- [ ] Logs are being written
- [ ] Database backups scheduled

---

## 🎉 YOU'RE READY FOR DAY 9!

All systems go for payment integration! 

**Next:** Run the setup script
```bash
bash setup_day9.sh
```

**Questions?** Check:
- `DAY_9_GUIDE.md` - Complete setup guide
- `DAY_9_API_EXAMPLES.md` - API reference
- `DAY_9_ARCHITECTURE.md` - System design

🚀 Let's build!
