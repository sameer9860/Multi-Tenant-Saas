# DAY 9 API EXAMPLES

## 1. INITIATE KHALTI PAYMENT

**Endpoint:** `POST /billing/khalti/init/`

**Request:**
```bash
curl -X POST http://localhost:8000/billing/khalti/init/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "PRO"}'
```

**Request Body:**
```json
{
    "plan": "PRO"
}
```

**Response (200 OK):**
```json
{
    "payment_id": 42,
    "api_url": "https://khalti.com/api/v2/epayment/initiate/",
    "payload": {
        "public_key": "test_public_key_xxxxx",
        "transaction_uuid": "txn_5_PRO_1707246000",
        "amount": 1390000,
        "product_name": "Upgrade to PRO Plan",
        "product_url": "https://yourdomain.com/billing",
        "website_url": "https://yourdomain.com",
        "return_url": "https://yourdomain.com/billing/khalti/callback/"
    },
    "amount": 13900,
    "plan": "PRO"
}
```

**Frontend Implementation (JavaScript):**
```javascript
// Get payment data from API
const response = await fetch('/billing/khalti/init/', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ plan: 'PRO' })
});

const data = await response.json();

// Initialize Khalti
KhaltiCheckout({
    publicKey: data.payload.public_key,
    productIdentity: data.payment_id,
    productName: data.payload.product_name,
    productUrl: data.payload.product_url,
    paymentPreference: ['KHALTI'],
    amount: data.amount * 100, // Convert to paisa
    eventHandler: {
        onSuccess(payload) {
            // Verify payment
            verifyPayment(data.payment_id, payload);
        },
        onError(error) {
            console.log(error);
        },
        onClose() {
            console.log('user closed the popup');
        }
    }
});
```

---

## 2. VERIFY KHALTI PAYMENT

**Endpoint:** `POST /billing/khalti/verify/`

**Request:**
```bash
curl -X POST http://localhost:8000/billing/khalti/verify/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "khalti_token_from_payment",
    "transaction_id": "txn_5_PRO_1707246000",
    "payment_id": 42
  }'
```

**Request Body:**
```json
{
    "token": "khalti_payment_token_here",
    "transaction_id": "txn_5_PRO_1707246000",
    "payment_id": 42
}
```

**Response (200 OK):**
```json
{
    "status": "success",
    "message": "Payment verified and plan activated",
    "plan": "PRO"
}
```

**Response (400 Error):**
```json
{
    "status": "failed",
    "message": "Payment verification failed",
    "error": {
        "detail": "Invalid token or amount"
    }
}
```

---

## 3. CHECK USAGE/LIMITS

**Endpoint:** `GET /billing/usage/`

**Request:**
```bash
curl -X GET http://localhost:8000/billing/usage/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
    "organization": 1,
    "invoices_created": 8,
    "customers_created": 3,
    "team_members_added": 1,
    "api_calls_used": 450,
    "updated_at": "2026-02-06T10:30:00Z",
    "plan": "FREE",
    "invoice_limit": 10,
    "invoice_percent": 80,
    "can_create_invoice": false,
    "invoice_limit_message": "Reached invoice limit (10). Upgrade your plan."
}
```

---

## 4. CREATE INVOICE (WITH LIMIT CHECK)

**Endpoint:** `POST /api/invoices/` (your invoice endpoint)

**Request:**
```bash
curl -X POST http://localhost:8000/api/invoices/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer": 5, "amount": 5000}'
```

**Response (403 Forbidden - Limit Reached):**
```json
{
    "error": "Reached invoice limit (10). Upgrade your plan.",
    "current": 10,
    "limit": 10,
    "plan": "FREE"
}
```

**Response (201 Created - Success):**
```json
{
    "id": 42,
    "invoice_number": "INV-001",
    "customer": 5,
    "amount": 5000,
    "status": "draft",
    "created_at": "2026-02-06T10:30:00Z"
}
```

---

## 5. ESEWA PAYMENT FLOW

**Endpoint:** `POST /billing/esewa/init/`

**Request:**
```bash
curl -X POST http://localhost:8000/billing/esewa/init/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan": "BASIC"}'
```

**Response:**
```json
{
    "payment_url": "https://uat.esewa.com.np/epay/main",
    "data": {
        "amt": 5000,
        "pdc": 0,
        "psc": 0,
        "txAmt": 0,
        "tAmt": 5000,
        "pid": 123,
        "scd": "EPAYTEST",
        "su": "http://localhost:8000/billing/esewa/success/",
        "fu": "http://localhost:8000/billing/esewa/failure/"
    }
}
```

---

## PLAN LIMITS REFERENCE

| Plan | Invoices | Customers | Team Members | API Calls/Month | Reports |
|------|----------|-----------|--------------|-----------------|---------|
| FREE | 10 | 5 | 1 | 100 | ❌ |
| BASIC | 1,000 | 50 | 3 | 10,000 | Basic |
| PRO | 3,000+ | Unlimited | Unlimited | Unlimited | Advanced |

---

## ERROR HANDLING

**Khalti Errors:**
- `401 Unauthorized` - Invalid token or expired
- `403 Forbidden` - Organization cannot perform action (limit reached)
- `404 Not Found` - Payment transaction not found
- `500 Internal Server Error` - Khalti API down

**Response Format:**
```json
{
    "error": "Description of what went wrong",
    "status": "failed",
    "payment_id": 42
}
```

---

## WEBHOOK HANDLING

**Khalti automatically redirects to:**
`https://yourdomain.com/billing/khalti/callback/?token=xxx&transaction_id=xxx`

Your application should:
1. Extract token and transaction_id
2. Call `/billing/khalti/verify/` with these values
3. Activate plan on success
4. Show success/failure page to user

---

## TESTING IN POSTMAN

1. Import these endpoints into Postman
2. Set `Authorization` header with Bearer token
3. Use test merchant keys from Khalti dashboard
4. Test both success and failure scenarios

**Postman Collection Template:**
```json
{
  "info": {
    "name": "Day 9 APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Khalti Init Payment",
      "request": {
        "method": "POST",
        "header": [
          {"key": "Authorization", "value": "Bearer {{token}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "url": {"raw": "http://localhost:8000/billing/khalti/init/"},
        "body": {"raw": "{\"plan\": \"PRO\"}"}
      }
    }
  ]
}
```
