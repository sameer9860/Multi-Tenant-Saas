# DAY 10 — INTEGRATION CHECKLIST

## ✅ All Files Created

### Backend Files
- [x] `/apps/subscriptions/__init__.py` ✓
- [x] `/apps/subscriptions/apps.py` ✓
- [x] `/apps/subscriptions/models.py` ✓
- [x] `/apps/subscriptions/tests.py` ✓
- [x] `/apps/subscriptions/views.py` ✓ (UpgradePlanView)
- [x] `/apps/subscriptions/urls.py` ✓ (upgrade endpoint)
- [x] `config/settings.py` - Updated ✓ (added to INSTALLED_APPS)
- [x] `config/urls.py` - Updated ✓ (added api/subscription/ path)

### Frontend Files
- [x] `/frontend/src/pages/Pricing.jsx` ✓ (Complete Pricing component)

### Documentation Files
- [x] `DAY_10_TESTING_GUIDE.md` - Comprehensive testing steps
- [x] `DAY_10_IMPLEMENTATION_SUMMARY.md` - Overview of changes
- [x] `DAY_10_CODE_SNIPPETS.md` - Quick reference
- [x] `DAY_10_INTEGRATION_CHECKLIST.md` - This file

---

## 📋 Setup Instructions (Do These Next)

### Step 1: Database Migrations

```bash
cd /home/samir/Multi-Tenant\ SaaS/

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

**Expected Output:**
```
Running migrations:
  Applying subscriptions.0001_initial... OK
```

### Step 2: Verify Settings

Check that `/config/settings.py` has:
```python
INSTALLED_APPS = [
    # ... other apps ...
    'apps.subscriptions',  # ← Should be here
]
```

### Step 3: Verify URLs

Check that `/config/urls.py` has:
```python
urlpatterns = [
    # ... other paths ...
    path('api/subscription/', include('apps.subscriptions.urls')),  # ← Should be here
]
```

### Step 4: Start Backend

```bash
python manage.py runserver
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
```

### Step 5: Start Frontend

In another terminal:
```bash
cd /home/samir/Multi-Tenant\ SaaS/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
Compiled app is running at http://localhost:3000
```

---

## 🧪 Quick Test (5 minutes)

### Test 1: Backend Endpoint

```bash
# In terminal with Django running, use Python shell
python manage.py shell

# Check if subscriptions app is registered
from django.apps import apps
apps_list = [app.name for app in apps.get_app_configs()]
print('apps.subscriptions' in apps_list)  # Should print: True
```

### Test 2: Frontend Component

1. Open http://localhost:3000/pricing
2. Should see 3 pricing cards
3. Should see Upgrade buttons

### Test 3: API Endpoint

```bash
# Get token first (login)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}'

# Copy the "access" token from response

# Test upgrade endpoint
curl -X POST http://localhost:8000/api/subscription/upgrade/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"BASIC"}'

# Should get 200 OK response
```

---

## 🔍 Verify Your Setup

### Backend Verification

```bash
# Check subscriptions app in Python
python manage.py shell

>>> from apps.subscriptions.views import UpgradePlanView
>>> UpgradePlanView  # Should show: <class 'apps.subscriptions.views.UpgradePlanView'>

>>> from apps.subscriptions.urls import urlpatterns
>>> urlpatterns  # Should show upgrade URL pattern

>>> from apps.billing.models import Subscription
>>> Subscription.objects.count()  # Should show number of subscriptions
```

### Frontend Verification

```bash
# Check if Pricing.jsx exists
ls -la /home/samir/Multi-Tenant\ SaaS/frontend/src/pages/Pricing.jsx

# Should show file with size ~6.6K
```

### URL Pattern Verification

```bash
# In Django shell
python manage.py shell

>>> from django.urls import get_resolver
>>> resolver = get_resolver()
>>> for pattern in resolver.url_patterns:
...     print(pattern)

# Should see 'api/subscription/' path in output
```

---

## 📊 Expected API Behavior

### Success Case (200 OK)
```
Request:
  POST /api/subscription/upgrade/
  Authorization: Bearer {token}
  {"plan": "BASIC"}

Response:
  200 OK
  {
    "message": "Successfully upgraded from FREE to BASIC",
    "old_plan": "FREE",
    "plan": "BASIC",
    "organization": "Acme Corp"
  }
```

### Error Case 1: Invalid Plan (400)
```
Request:
  POST /api/subscription/upgrade/
  {"plan": "INVALID"}

Response:
  400 Bad Request
  {"error": "Invalid plan. Choose from ['FREE', 'BASIC', 'PRO']"}
```

### Error Case 2: No Authentication (401)
```
Request:
  POST /api/subscription/upgrade/
  (No Authorization header)

Response:
  401 Unauthorized
  {"detail": "Authentication credentials were not provided."}
```

---

## 🐛 Troubleshooting

### Problem: "No app named 'subscriptions'"

**Solution:**
Check `config/settings.py` - ensure `'apps.subscriptions'` is in `INSTALLED_APPS`

```python
INSTALLED_APPS = [
    # ...
    'apps.subscriptions',  # Make sure it's here
]
```

Then run:
```bash
python manage.py migrate
```

---

### Problem: "POST /api/subscription/upgrade/ - 404 Not Found"

**Solution:**
Check `config/urls.py` - ensure the path is registered:

```python
urlpatterns = [
    # ...
    path('api/subscription/', include('apps.subscriptions.urls')),  # Make sure it's here
]
```

Restart Django server.

---

### Problem: "Authentication credentials were not provided"

**Solution:**
Make sure you're sending Authorization header:

```bash
curl -X POST http://localhost:8000/api/subscription/upgrade/ \
  -H "Authorization: Bearer YOUR_TOKEN" \  # ← This is required
  -H "Content-Type: application/json" \
  -d '{"plan":"BASIC"}'
```

Get token by logging in:
```bash
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_user","password":"your_pass"}'
```

---

### Problem: Frontend shows 404 for /api/subscription/upgrade/

**Solution:**
1. Check Django is running on `http://localhost:8000`
2. Check React is running on `http://localhost:3000`
3. Check CORS settings if needed
4. Look at browser DevTools → Network tab for actual error

---

## ✨ Once Everything Works

You should be able to:

1. ✅ Login at http://localhost:3000/login
2. ✅ Go to http://localhost:3000/pricing
3. ✅ Click "Upgrade to BASIC"
4. ✅ See success alert
5. ✅ See plan changed in pricing page
6. ✅ Check database shows updated plan

---

## 📞 Common Questions

### Q: Do I need to run migrations?
**A:** Yes! Run `python manage.py migrate` to create subscription tables.

### Q: Does the upgrade actually process payment?
**A:** No, it's a mock upgrade. Payment integration comes in Day 11.

### Q: Where do I add the Pricing link in my app?
**A:** Add this to your main navigation:
```jsx
<Link to="/pricing">Pricing</Link>
```

### Q: Can users downgrade?
**A:** Yes, the endpoint accepts any valid plan, so you can also downgrade.

### Q: What if user has no subscription?
**A:** The code creates one automatically with `get_or_create()`.

---

## 🎯 Day 10 Success Metrics

You've successfully completed Day 10 when:

- [ ] Backend `/api/subscription/upgrade/` endpoint works (200 OK)
- [ ] Frontend shows Pricing page with 3 plans
- [ ] Upgrade button updates database
- [ ] Organization plan field changes
- [ ] Subscription plan field changes
- [ ] Usage dashboard limits update (if implemented)
- [ ] Error handling works (invalid plans return 400)
- [ ] Authentication required (no token = 401)

---

## 🚀 What's Next (Day 11)

Once this is working perfectly, you can add:

1. **Khalti Payment Integration**
   - Add Khalti SDK
   - Implement payment gateway
   - Handle webhooks

2. **eSewa Payment Integration**
   - Add eSewa API
   - Handle response verification

3. **Email Notifications**
   - Send upgrade confirmation
   - Send invoice on plan change

4. **Deployment**
   - Docker setup
   - AWS/Heroku deployment

---

## 📎 Related Files (For Reference)

- [DAY_10_TESTING_GUIDE.md](DAY_10_TESTING_GUIDE.md) - Step-by-step testing
- [DAY_10_CODE_SNIPPETS.md](DAY_10_CODE_SNIPPETS.md) - Quick code reference
- [DAY_10_IMPLEMENTATION_SUMMARY.md](DAY_10_IMPLEMENTATION_SUMMARY.md) - Overview

---

**Status: ✅ READY TO TEST**

All code is in place. Start with the setup instructions above!
