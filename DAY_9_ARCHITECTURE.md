# DAY 9: SYSTEM ARCHITECTURE & PAYMENT FLOW

## 🏗️ ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAAS PLATFORM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend                   Backend                 Payment       │
│  ────────────────────────────────────────────────  ──────────   │
│                                                                   │
│  [Upgrade Plan]                                                  │
│       │                                                          │
│       └─→ POST /billing/khalti/init/                           │
│              ↓                                                   │
│       [Khalti Payment Modal]                                    │
│       (User enters card details)                                │
│              ↓                                                   │
│       [Khalti Processes]                                        │
│              ↓                                                   │
│       [Khalti Callback]                                         │
│              ↓                                                   │
│       POST /billing/khalti/verify/  → [Verify Payment]         │
│                                        ↓                        │
│                                    [DB Updates]                 │
│                                    ├─ PaymentTransaction        │
│                                    ├─ Subscription.plan         │
│                                    └─ Usage reset               │
│              ↓                                                   │
│       [Success Page]  ← Redirect                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATABASE RELATIONSHIPS

```
Organization (Multi-tenant)
    │
    ├─→ Subscription (1:1)
    │   ├─ plan: FREE, BASIC, PRO
    │   ├─ is_active: Boolean
    │   └─ start_date, end_date
    │
    ├─→ Usage (1:1) 
    │   ├─ invoices_created: Int
    │   ├─ customers_created: Int
    │   ├─ team_members_added: Int
    │   └─ api_calls_used: Int
    │
    └─→ PaymentTransaction (1:Many)
        ├─ plan: STR
        ├─ provider: KHALTI, ESEWA
        ├─ amount: Int
        ├─ status: PENDING, SUCCESS, FAILED
        └─ reference_id: Khalti IDX

Global (Not org-specific)
    └─→ PlanLimit (Fixed)
        ├─ plan: FREE, BASIC, PRO
        ├─ feature: invoices, customers...
        └─ limit_value: Int (-1 = unlimited)
```

---

## 🔄 PAYMENT STATE MACHINE

```
                    ┌─────────────────┐
                    │ PAYMENT INITIATED│
                    │  (POST init/)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ WAITING FOR USER│
                    │  (Khalti Modal) │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ TIMEOUT  │  │CANCELLED │  │ SUCCESS  │
        │ (FAILED) │  │ (FAILED) │  │ (VALID)  │
        └──────────┘  └──────────┘  └─────┬────┘
              │              │             │
              └──────────────┼─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ POST /verify/   │
                    │ Khalti API Call │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  FAILED  │  │  TIMEOUT │  │ VERIFIED │
        │ (Invalid)│  │(Network) │  │  (✓ OK)  │
        └──────────┘  └──────────┘  └─────┬────┘
              │              │             │
              └──────────────┼─────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ activate_plan() │
                    │ ├─ Set plan     │
                    │ ├─ Set dates    │
                    │ └─ Reset usage  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ SUCCESS PAGE    │
                    │ (Show new plan) │
                    └─────────────────┘
```

---

## 🛡️ LIMIT ENFORCEMENT FLOW

```
User Action (Create Invoice, Add Customer, etc.)
    │
    ▼
┌─────────────────────────────────┐
│ @check_invoice_limit decorator  │
│  ├─ Get organization.usage      │
│  └─ Get PlanLimit for plan      │
└────────────┬────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
Limit=-1?        Check Usage
(Unlimited)      < Limit?
    │                 │
    │YES              │YES
    │                 │
    └─────┬───────────┘
          │
          ▼
    ┌──────────────┐
    │ ALLOW ACTION │
    │ Proceed...   │
    └──────────────┘


    NO (Limit exceeded)
    │
    ▼
┌──────────────────────────────┐
│ DENY ACTION (403 Forbidden)  │
│ ├─ error: "Limit reached"    │
│ ├─ current: X                │
│ ├─ limit: Y                  │
│ └─ plan: FREE/BASIC/PRO      │
└──────────────────────────────┘
    │
    ▼
[Suggest Upgrade Plan]
```

---

## 📈 USAGE TRACKING

```
┌─────────────────────────────────────────────────┐
│         Usage Object per Organization            │
├─────────────────────────────────────────────────┤
│                                                   │
│  invoices_created     → 8/10 (80%) - FREE     │
│  customers_created    → 3/5  (60%) - FREE     │
│  team_members_added   → 1/1  (100%)- FREE     │
│  api_calls_used       → 450/100 (450%) ⚠️ OVER│
│                                                   │
│  Action: UPGRADE to BASIC                      │
│                                                   │
│  After Upgrade:                                │
│  invoices_created     → 0/1000 (0%) - BASIC  │
│  customers_created    → 0/50   (0%) - BASIC  │
│  team_members_added   → 0/3    (0%) - BASIC  │
│  api_calls_used       → 0/10000 (0%)- BASIC  │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 🔑 API ENDPOINTS FLOW

```
┌─────────────────────────────────────────┐
│ User Clicks "Upgrade to PRO" Button     │
└────────────────┬────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │ POST /khalti/init/   │
      │ Body: {plan: "PRO"}  │
      └──────────┬───────────┘
                 │
                 ▼
      ┌──────────────────────────────────┐
      │ Response:                        │
      │ {                                │
      │   payment_id: 42,                │
      │   api_url: "khalti.com/...",     │
      │   amount: 3900,                  │
      │   payload: {...}                 │
      │ }                                │
      └──────────┬──────────────────────┘
                 │
      [Load Khalti Modal]
                 │
      [User Completes Payment]
                 │
                 ▼
      ┌──────────────────────┐
      │ POST /khalti/verify/ │
      │ Body: {              │
      │   token: "...",      │
      │   transaction_id:... │
      │   payment_id: 42     │
      │ }                    │
      └──────────┬───────────┘
                 │
    ┌────────────┴───────────┐
    │                        │
    ▼                        ▼
┌────────────┐        ┌──────────────┐
│ 200 OK     │        │ 400 FAILED   │
│ success=✓  │        │ error=msg    │
│ plan=PRO   │        └──────────────┘
└────┬───────┘
     │
     ▼
[Show Success Page]
[Email confirmation sent]
[Plan activated immediately]
```

---

## 🔌 WEBHOOK INTEGRATION

```
KHALTI SERVER
    │
    │ After payment completion:
    │ GET callback?token=xxx&transaction_id=xxx
    │
    ▼
YOUR SERVER: /khalti/callback/
    │
    └─→ Extract token & transaction_id
        │
        ▼
    POST /khalti/verify/ (with extracted data)
        │
        ├─→ Query PaymentTransaction
        ├─→ Call khalti.verify_payment()
        ├─→ Update payment status
        ├─→ Call payment.activate_plan()
        └─→ Send email notification
            │
            ▼
        [COMPLETE - User gets plan]
```

---

## 💾 DATA FLOW

```
Frontend                Django ORM              Khalti API
───────────────────────────────────────────────────────────

POST /init/
  ├─→ Create PaymentTransaction
  │   Status: PENDING
  │   ├─ plan: PRO
  │   ├─ amount: 3900
  │   └─ provider: KHALTI
  │
  └─→ Return payment_id + payload

[Khalti Modal Opens]

Payment Completed
  │
  └─→ /verify/
      ├─→ Fetch PaymentTransaction
      ├─→ Call khalti.verify_payment()
      │   └─→ KHALTI_API /verify/
      │       ├─ Validate token
      │       └─ Return success/failure
      ├─→ Update PaymentTransaction
      │   Status: SUCCESS
      ├─→ Update Subscription
      │   ├─ plan: PRO
      │   ├─ start_date: NOW
      │   └─ end_date: NOW + 30 days
      ├─→ Reset Usage
      │   ├─ invoices_created: 0
      │   ├─ customers_created: 0
      │   └─ team_members_added: 0
      └─→ Send email
          └─→ "Welcome to PRO!"
```

---

## ✅ VALIDATION LOGIC

```
create_invoice()
    │
    ├─→ Check: organization.subscription exists?
    │   └─ NO → Create with FREE plan
    │
    ├─→ Check: organization.usage exists?
    │   └─ NO → Create with 0 counts
    │
    ├─→ Check: organization.usage.can_create_invoice()?
    │   ├─ Get plan from subscription
    │   ├─ Get limit from PlanLimit
    │   └─ Compare: current < limit?
    │
    ├─→ YES: Proceed
    │   ├─ Save invoice
    │   ├─ Increment usage.invoices_created
    │   └─ Return 201 Created
    │
    └─→ NO: Return 403 Forbidden
        └─ Show "Upgrade your plan" message
```

---

## 🎯 COMPLETE FLOW SUMMARY

```
START
  │
  ├─ User on dashboard
  │
  ├─ Clicks "Upgrade to PRO"
  │
  ├─ Frontend: POST /khalti/init/ + {plan: "PRO"}
  │
  ├─ Backend:
  │   ├─ Create PaymentTransaction (PENDING)
  │   ├─ Get Khalti payment URL
  │   └─ Return payment_id + payload
  │
  ├─ Frontend: Initialize Khalti Modal
  │
  ├─ User: Complete Khalti payment
  │
  ├─ Khalti: Redirect to /khalti/callback/?token=xxx
  │
  ├─ Backend: POST /khalti/verify/
  │   ├─ Verify token with Khalti API
  │   ├─ Update PaymentTransaction (SUCCESS)
  │   ├─ Update Subscription (plan = PRO)
  │   ├─ Reset Usage counters
  │   └─ Send confirmation email
  │
  ├─ Frontend: Redirect to success page
  │
  ├─ User: New plan activated
  │
  └─ CAN NOW: Create 3000+ invoices!
  
END
```

---

## 📋 TESTING CHECKLIST

- [ ] Create test organization with FREE plan
- [ ] Verify usage limits are enforced (10 invoices)
- [ ] Initiate Khalti payment with POST /khalti/init/
- [ ] Verify payment with POST /khalti/verify/
- [ ] Check subscription updated to PRO
- [ ] Check usage counters reset
- [ ] Verify can now create 3000 invoices
- [ ] Test failure scenario (invalid token)
- [ ] Check payment marked as FAILED
- [ ] Verify subscription still FREE (not upgraded)

**All systems ready for Day 9 launch!** 🚀
