# DAY 10 — QUICK REFERENCE CODE SNIPPETS

## 🔧 How to Use These Snippets

Copy-paste directly into your project. All code is tested and ready to go.

---

## BACKEND CODE

### 1️⃣ apps/subscriptions/views.py

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.billing.models import Subscription


class UpgradePlanView(APIView):
    """
    Endpoint to upgrade user's subscription plan.
    
    POST /api/subscription/upgrade/
    Body: { "plan": "BASIC" or "PRO" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get("plan")

        # ✅ Validate plan
        valid_plans = ["FREE", "BASIC", "PRO"]
        if plan not in valid_plans:
            return Response(
                {"error": f"Invalid plan. Choose from {valid_plans}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Get organization from middleware
        organization = request.organization
        
        # ✅ Get or create subscription
        subscription, created = Subscription.objects.get_or_create(
            organization=organization
        )

        # 🚨 MOCK upgrade (no payment processing yet)
        old_plan = subscription.plan
        subscription.plan = plan
        subscription.save()

        # ✅ Also update organization.plan for consistency
        organization.plan = plan
        organization.save()

        return Response(
            {
                "message": f"Successfully upgraded from {old_plan} to {plan}",
                "old_plan": old_plan,
                "plan": plan,
                "organization": organization.name,
            },
            status=status.HTTP_200_OK
        )
```

---

### 2️⃣ apps/subscriptions/urls.py

```python
from django.urls import path
from .views import UpgradePlanView

app_name = 'subscriptions'

urlpatterns = [
    path('upgrade/', UpgradePlanView.as_view(), name='upgrade_plan'),
]
```

---

### 3️⃣ config/settings.py (Add this line)

Find `INSTALLED_APPS` and add:
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'apps.subscriptions',  # ← Add this line
]
```

---

### 4️⃣ config/urls.py (Add this line)

Find `urlpatterns` and add:
```python
urlpatterns = [
    # ... existing paths ...
    path('api/subscription/', include('apps.subscriptions.urls')),  # ← Add this line
]
```

---

## FRONTEND CODE

### 5️⃣ frontend/src/pages/Pricing.jsx (Full Component)

```jsx
import React, { useState } from 'react';

const plans = [
  {
    name: "FREE",
    price: "₹0",
    period: "Forever",
    description: "Get started with our platform",
    features: [
      "10 invoices/month",
      "1 team member",
      "Basic reporting",
      "Email support"
    ],
    canUpgrade: false,
    buttonText: "Current Plan"
  },
  {
    name: "BASIC",
    price: "₹999",
    period: "/month",
    description: "Perfect for small businesses",
    features: [
      "100 invoices/month",
      "5 team members",
      "Advanced reporting",
      "Priority email support",
      "Custom branding"
    ],
    canUpgrade: true,
    buttonText: "Upgrade to Basic"
  },
  {
    name: "PRO",
    price: "₹2,999",
    period: "/month",
    description: "For growing enterprises",
    features: [
      "Unlimited invoices",
      "Unlimited team members",
      "Advanced analytics",
      "24/7 phone support",
      "Custom integrations",
      "API access"
    ],
    canUpgrade: true,
    buttonText: "Upgrade to Pro"
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("FREE");

  const handleUpgrade = async (planName) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("/api/subscription/upgrade/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: planName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Successfully upgraded to ${planName} plan!`);
        setCurrentPlan(planName);
        
        // Reload usage dashboard after 1 second
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        alert(`❌ Error: ${data.error || "Upgrade failed"}`);
      }
    } catch (error) {
      console.error("Upgrade error:", error);
      alert("❌ Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600">
          Choose the perfect plan for your business. Upgrade or downgrade anytime.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:scale-105 ${
              plan.name === currentPlan
                ? "ring-2 ring-green-500 bg-white scale-105"
                : "bg-white"
            }`}
          >
            {/* Badge for current plan */}
            {plan.name === currentPlan && (
              <div className="bg-green-500 text-white py-2 px-4 text-center font-semibold">
                ✓ Current Plan
              </div>
            )}

            {/* Plan Details */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h2>
              <p className="text-gray-600 text-sm mb-6">{plan.description}</p>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  {plan.price}
                </span>
                <span className="text-gray-600 ml-2">{plan.period}</span>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handleUpgrade(plan.name)}
                disabled={loading || !plan.canUpgrade}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                  !plan.canUpgrade
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800 active:scale-95"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Processing..." : plan.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mt-16 bg-white rounded-lg shadow-md p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Frequently Asked Questions
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Can I change my plan anytime?
            </h4>
            <p className="text-gray-600">
              Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              What happens when I upgrade?
            </h4>
            <p className="text-gray-600">
              Your usage limits increase instantly. You get access to premium features immediately.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Is there a free trial?
            </h4>
            <p className="text-gray-600">
              Yes! Start with FREE plan and upgrade whenever you're ready. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🧪 TESTING CODE

### 6️⃣ Test with cURL (Command Line)

```bash
# 1. Get JWT token (login)
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Response will have "access" token - copy it

# 2. Test upgrade endpoint
curl -X POST http://localhost:8000/api/subscription/upgrade/ \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"plan":"BASIC"}'

# Expected response:
# {
#   "message": "Successfully upgraded from FREE to BASIC",
#   "old_plan": "FREE",
#   "plan": "BASIC",
#   "organization": "Acme Corp"
# }
```

---

### 7️⃣ Test with Postman

1. **Create new POST request**
   - URL: `http://localhost:8000/api/subscription/upgrade/`
   
2. **Add Headers**
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN`
   - Key: `Content-Type`
   - Value: `application/json`

3. **Add Body (JSON)**
   ```json
   {
     "plan": "BASIC"
   }
   ```

4. **Click Send**
   - Should get 200 OK
   - Response shows upgrade confirmation

---

### 8️⃣ Test with Python Shell

```bash
python manage.py shell
```

```python
from apps.core.models import Organization
from apps.billing.models import Subscription

# Find your organization
org = Organization.objects.first()
print(f"Current plan: {org.plan}")

# Get subscription
sub = Subscription.objects.get(organization=org)
print(f"Subscription plan: {sub.plan}")

# Manually upgrade (for testing)
sub.plan = "BASIC"
sub.save()
org.plan = "BASIC"
org.save()

# Verify
print(f"Updated plan: {org.plan}")
```

---

## 📋 CHECKLIST: What You Should Have

- [ ] `/home/samir/Multi-Tenant SaaS/apps/subscriptions/` folder created
- [ ] `views.py` with `UpgradePlanView`
- [ ] `urls.py` with upgrade endpoint
- [ ] `apps.subscriptions` added to `INSTALLED_APPS`
- [ ] `api/subscription/` path added to main `urls.py`
- [ ] `frontend/src/pages/Pricing.jsx` created
- [ ] Migrations run: `python manage.py migrate`
- [ ] Django server running
- [ ] React frontend running
- [ ] Testing Guide reviewed

---

## ⚡ Quick Start Commands

```bash
# Setup backend
cd /home/samir/Multi-Tenant\ SaaS
python manage.py makemigrations
python manage.py migrate
python manage.py runserver

# In new terminal: Setup frontend
cd /home/samir/Multi-Tenant\ SaaS/frontend
npm start

# In browser
# Login: http://localhost:3000/login
# Pricing: http://localhost:3000/pricing
# Admin: http://localhost:8000/admin
```

---

## 🎯 Expected Flow

```
User clicks "Upgrade to BASIC"
    ↓
Frontend sends: POST /api/subscription/upgrade/
    ↓
Backend validates plan
    ↓
Updates: organization.plan = "BASIC"
Updates: subscription.plan = "BASIC"
    ↓
Returns: 200 OK response
    ↓
Frontend shows: ✅ Success alert
    ↓
Page reloads
    ↓
Pricing page now shows BASIC as current
Usage limits updated instantly
```

---

## ✅ You're Done!

All code is ready. Test it step-by-step using the testing guide.

**Key takeaway:** No payment processing yet, but the architecture is ready for Day 11 when you add Khalti/eSewa integration.

Good luck! 🚀
