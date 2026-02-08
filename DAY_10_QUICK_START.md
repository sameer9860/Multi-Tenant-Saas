# DAY 10 — QUICK START (5-MINUTE SETUP)

## ⚡ TL;DR - What Was Done

✅ Created `/apps/subscriptions/` app with upgrade endpoint
✅ Created `/frontend/src/pages/Pricing.jsx` component
✅ Updated `config/settings.py` and `config/urls.py`
✅ Everything ready to test

---

## 🚀 QUICK START (Copy-Paste These)

### Terminal 1: Backend

```bash
cd "/home/samir/Multi-Tenant SaaS"

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start server
python manage.py runserver
```

**Expected output:**
```
Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: Frontend

```bash
cd "/home/samir/Multi-Tenant SaaS/frontend"

# Start React
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view app in the browser at http://localhost:3000
```

---

## 🧪 QUICK TEST (5 Steps)

### 1️⃣ Login
- Go to: http://localhost:3000/login
- Login with your credentials

### 2️⃣ Open Pricing
- Go to: http://localhost:3000/pricing
- See 3 pricing cards

### 3️⃣ Upgrade
- Click "Upgrade to BASIC"
- See success alert

### 4️⃣ Verify Frontend
- Page reloads
- BASIC shows "✓ Current Plan" badge

### 5️⃣ Verify Backend
- Open: http://localhost:8000/admin
- Go to Subscriptions
- Check plan = "BASIC"

**Done! ✅**

---

## 📂 Files Created

```
✅ apps/subscriptions/
   ├── __init__.py
   ├── apps.py
   ├── models.py
   ├── tests.py
   ├── views.py (UpgradePlanView)
   └── urls.py

✅ frontend/src/pages/
   └── Pricing.jsx

✅ config/settings.py (UPDATED)
✅ config/urls.py (UPDATED)

✅ Documentation:
   ├── DAY_10_TESTING_GUIDE.md
   ├── DAY_10_CODE_SNIPPETS.md
   ├── DAY_10_IMPLEMENTATION_SUMMARY.md
   ├── DAY_10_INTEGRATION_CHECKLIST.md
   ├── DAY_10_ARCHITECTURE.md
   └── DAY_10_QUICK_START.md (this file)
```

---

## 🔗 API Endpoint

```
POST /api/subscription/upgrade/

Authorization: Bearer {token}
Content-Type: application/json

{"plan": "BASIC"}
```

**Response (200 OK):**
```json
{
  "message": "Successfully upgraded from FREE to BASIC",
  "old_plan": "FREE",
  "plan": "BASIC",
  "organization": "Your Org Name"
}
```

---

## 💡 Key Points

✅ **No Payment Yet** - Mock upgrade only
✅ **JWT Required** - Token-based auth
✅ **Instant Update** - Database changes immediately
✅ **Clean Architecture** - Ready for Khalti/eSewa
✅ **3 Plans** - FREE, BASIC, PRO

---

## 🎯 Expected Behavior

| Action | Result |
|--------|--------|
| Click Upgrade | Button shows "Processing..." |
| Request sent | POST to /api/subscription/upgrade/ |
| Backend validates | Checks if plan is valid |
| Database updates | Both org and subscription updated |
| Frontend confirms | Shows success alert |
| Page reloads | Shows BASIC as current plan |
| Usage limits | Update automatically |

---

## ⚠️ If Something Doesn't Work

### Problem: 404 on upgrade endpoint
**Fix:** Check `config/urls.py` has:
```python
path('api/subscription/', include('apps.subscriptions.urls')),
```

### Problem: "Authentication credentials not provided"
**Fix:** Make sure token is in localStorage:
```js
localStorage.getItem("token")
```

### Problem: Database shows old plan
**Fix:** Run migrations:
```bash
python manage.py migrate
```

### Problem: Frontend can't reach backend
**Fix:** 
- Django on http://localhost:8000 ✓
- React on http://localhost:3000 ✓
- No CORS errors ✓

---

## 📸 Screenshots to Take

1. **Login screen** - For reference
2. **Pricing page** - All 3 cards visible
3. **Browser DevTools** - Network tab showing 200 OK
4. **Admin panel** - Subscription plan changed
5. **Dashboard** - Usage limits increased

---

## 🎓 Learning Points

This day teaches:

✅ API endpoint creation (POST)
✅ JWT authentication in Django REST
✅ Request/response handling
✅ Database updates
✅ Frontend-backend integration
✅ Error handling & validation
✅ Tailwind CSS for UI
✅ React state management

---

## 🚀 What's Next

After this works perfectly:

**Day 11:** Add Khalti payment integration
**Day 12:** Add eSewa payment
**Day 13:** Email notifications
**Day 14:** Deployment to production

---

## 📋 Verification Checklist

- [ ] `/apps/subscriptions/` folder exists
- [ ] `views.py` has `UpgradePlanView`
- [ ] `urls.py` has `/upgrade/` route
- [ ] `config/settings.py` has `'apps.subscriptions'`
- [ ] `config/urls.py` has `api/subscription/` path
- [ ] `frontend/src/pages/Pricing.jsx` exists
- [ ] Django server running (port 8000)
- [ ] React server running (port 3000)
- [ ] Can access http://localhost:3000/pricing
- [ ] Can click upgrade button
- [ ] Gets 200 OK response
- [ ] Database updated

---

## 💬 Common Questions

**Q: Do I need Khalti/eSewa now?**
A: No! Payment comes Day 11.

**Q: Can users downgrade?**
A: Yes, endpoint accepts any valid plan.

**Q: Where's the invoice generation?**
A: Coming in Day 12+.

**Q: Is this production-ready?**
A: No, only for local testing. Deploy on Day 14.

**Q: Can I modify pricing?**
A: Edit `frontend/src/pages/Pricing.jsx` to change prices/features.

---

## 🎉 Success Criteria

You've completed Day 10 when:

✅ User can see pricing page
✅ User can click upgrade
✅ API returns 200 OK
✅ Database plan field updates
✅ Page refreshes with new plan

**That's it! You're done with the basics.** 🚀

---

## 📞 Need Help?

Check these files in order:

1. `DAY_10_TESTING_GUIDE.md` - Detailed testing steps
2. `DAY_10_CODE_SNIPPETS.md` - Code reference
3. `DAY_10_ARCHITECTURE.md` - System diagrams
4. `DAY_10_INTEGRATION_CHECKLIST.md` - Setup verification

---

**Ready? Let's go!**

```bash
# Terminal 1
cd "/home/samir/Multi-Tenant SaaS"
python manage.py migrate
python manage.py runserver

# Terminal 2
cd "/home/samir/Multi-Tenant SaaS/frontend"
npm start

# Browser
http://localhost:3000/login
http://localhost:3000/pricing
Click "Upgrade to BASIC" ✓
```

**Happy coding! 🎉**
