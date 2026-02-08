# DAY 10 — UPGRADE FLOW TESTING CHECKLIST

## Prerequisites
- ✅ Subscriptions app created
- ✅ Backend endpoint: `POST /api/subscription/upgrade/`
- ✅ Frontend Pricing component
- ✅ Database migrations done

## Step 0: Setup
Run these commands in your Django project:

```bash
# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Start Django server
python manage.py runserver
```

Then in another terminal, start your React frontend:
```bash
npm start
```

---

## Test Case 1: Login as FREE User ✅

### Step 1a: Register/Login
1. Go to login page: `http://localhost:3000/login`
2. Create an account OR use existing FREE account
3. You should see: "Current Plan: FREE"

### Expected Result
✅ Logged in successfully with FREE plan

---

## Test Case 2: Open Pricing Page 📊

### Step 2a: Navigate to Pricing
1. Go to: `http://localhost:3000/pricing`
2. You should see 3 plan cards:
   - FREE (Current Plan badge)
   - BASIC (Upgrade to Basic button)
   - PRO (Upgrade to Pro button)

### Expected Result
✅ All 3 plans visible
✅ FREE plan shows "Current Plan"
✅ BASIC & PRO show upgrade buttons

---

## Test Case 3: Click Upgrade Button 🚀

### Step 3a: Upgrade to BASIC
1. On Pricing page, click "Upgrade to Basic"
2. Button should show "Processing..." for 1-2 seconds
3. You should see: ✅ Success alert
   ```
   ✅ Successfully upgraded to BASIC plan!
   ```

### Expected Result
✅ Alert appears
✅ Page reloads
✅ Back on Pricing page

---

## Test Case 4: Verify Plan Changed ✔️

### Step 4a: Check Current Plan
1. After reload, you should see:
   - BASIC card has "✓ Current Plan" badge
   - FREE card no longer has badge
   - PRO card still has "Upgrade to Pro"

### Expected Result
✅ BASIC is now the current plan

---

## Test Case 5: Check Database Changes 🗄️

### Step 5a: Verify in Django Admin
1. Open: `http://localhost:8000/admin`
2. Go to: Subscriptions → Subscription
3. Find your organization
4. Check:
   - ✅ `plan` field = "BASIC"
   - ✅ `is_active` = True

### Expected Result
✅ Database updated correctly

---

## Test Case 6: API Response Verification 📡

### Step 6a: Check Network Tab
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Click "Upgrade to Pro" button
4. Look for POST request: `/api/subscription/upgrade/`
5. Click the request, go to "Response" tab

### Expected Response
```json
{
  "message": "Successfully upgraded from BASIC to PRO",
  "old_plan": "BASIC",
  "plan": "PRO",
  "organization": "Your Organization Name"
}
```

### Expected Status
✅ 200 OK

---

## Test Case 7: Usage Dashboard Reflects New Limits 📈

### Step 7a: Check Usage Dashboard
1. After upgrade, go to: `http://localhost:3000/dashboard`
2. Check invoice creation limits:
   - FREE: 10 invoices/month
   - BASIC: 100 invoices/month
   - PRO: Unlimited

3. Try creating an invoice - should now have new limit

### Expected Result
✅ Limits updated instantly
✅ Can create more invoices

---

## Test Case 8: Error Handling ⚠️

### Step 8a: Test Invalid Plan
Use cURL or Postman:

```bash
curl -X POST http://localhost:8000/api/subscription/upgrade/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "INVALID"}'
```

### Expected Response
```json
{
  "error": "Invalid plan. Choose from ['FREE', 'BASIC', 'PRO']"
}
```

### Expected Status
❌ 400 Bad Request

---

## Test Case 9: Authentication Check 🔐

### Step 9a: Test Without Token
Use cURL without authorization header:

```bash
curl -X POST http://localhost:8000/api/subscription/upgrade/ \
  -H "Content-Type: application/json" \
  -d '{"plan": "BASIC"}'
```

### Expected Response
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### Expected Status
❌ 401 Unauthorized

---

## Test Case 10: Downgrade Test (Bonus) ↙️

### Step 10a: Downgrade from PRO to BASIC
1. Start on PRO plan
2. Click "Upgrade to Basic" (works for both up and down)
3. Check that plan changes to BASIC
4. Limits decrease but no data is lost

### Expected Result
✅ Downgrade works
✅ No data loss

---

## Screenshots to Capture 📸

1. **Pricing Page**
   - Path: `/frontend/src/pages/Pricing.jsx`
   - Show: All 3 cards visible

2. **API Response (DevTools)**
   - Network tab showing 200 OK
   - Response JSON with plan upgrade

3. **Admin Panel**
   - Before upgrade
   - After upgrade
   - Database reflecting change

4. **Usage Dashboard**
   - Before upgrade (10 invoice limit)
   - After upgrade (100 invoice limit)

---

## Troubleshooting 🔧

### Problem: "Invalid plan" error
- ✅ Check request body: `{"plan": "BASIC"}`
- ✅ Plan must be: FREE, BASIC, or PRO (case-sensitive)

### Problem: "Authentication credentials not provided"
- ✅ Check localStorage.getItem("token")
- ✅ Token must be valid JWT

### Problem: 500 error on upgrade
- ✅ Check Django logs: `python manage.py runserver`
- ✅ Ensure apps.subscriptions in INSTALLED_APPS
- ✅ Run migrations: `python manage.py migrate`

### Problem: Frontend can't reach backend
- ✅ Django running on `localhost:8000`?
- ✅ React running on `localhost:3000`?
- ✅ Check CORS settings

---

## Success Criteria ✅

You've completed Day 10 when:

- [ ] User can see pricing page
- [ ] User can click upgrade button
- [ ] API returns 200 OK with plan
- [ ] Database plan field updates
- [ ] Usage dashboard limits change
- [ ] Error handling works
- [ ] Authentication required
- [ ] Page reloads after upgrade

---

## Next Steps (Day 11+)

Once this is working:

1. **Add Khalti Payment** - Real payment processing
2. **Add eSewa Payment** - Alternative payment
3. **Email Notifications** - Send upgrade confirmation
4. **Audit Trail** - Log plan changes
5. **Deployment** - Push to production

---

## Debug Commands

### Check if subscriptions app is registered
```bash
python manage.py shell
>>> from django.apps import apps
>>> 'apps.subscriptions' in [app.name for app in apps.get_app_configs()]
```

### Check subscription in database
```bash
python manage.py shell
>>> from apps.billing.models import Subscription
>>> Subscription.objects.all()
```

### Test endpoint directly
```bash
python manage.py shell
>>> from rest_framework.test import APIRequestFactory
>>> from apps.subscriptions.views import UpgradePlanView
```

---

**Happy Testing! 🎉**
