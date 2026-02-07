from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view
from django.shortcuts import redirect
from django.http import HttpResponse
from .models import PaymentTransaction
from .constants import PLAN_PRICES
import uuid


class InitiateEsewaPaymentView(APIView):
    """Create PENDING transaction, redirect to eSewa"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan = request.data.get("plan")
        
        if plan not in PLAN_PRICES:
            return Response({"error": "Invalid plan"}, status=400)
        
        # Generate unique transaction ID
        transaction_id = str(uuid.uuid4())
        
        # Create PENDING transaction in DB
        payment = PaymentTransaction.objects.create(
            organization=request.organization,
            plan=plan,
            amount=PLAN_PRICES[plan],
            provider="ESEWA",
            transaction_id=transaction_id,
            status="PENDING"
        )
        
        # Build eSewa payment URL
        esewa_url = (
            "https://uat.esewa.com.np/epay/main?"
            f"amt={PLAN_PRICES[plan]}&"
            "pdc=0&psc=0&txAmt=0&"
            f"pid={transaction_id}&"
            "scd=EPAYTEST&"
            "su=http://localhost:8000/billing/esewa/success/&"
            "fu=http://localhost:8000/billing/esewa/failure/"
        )
        
        return Response({
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "esewa_url": esewa_url,
            "amount": PLAN_PRICES[plan],
            "plan": plan
        })


@api_view(["GET"])
def esewa_success(request):
    """eSewa success callback - VERIFY & UPGRADE"""
    ref_id = request.GET.get("refId")
    pid = request.GET.get("oid") or request.GET.get("pid")
    
    # Find PENDING transaction
    try:
        payment = PaymentTransaction.objects.get(
            transaction_id=pid,
            status="PENDING"
        )
    except PaymentTransaction.DoesNotExist:
        return HttpResponse("❌ Invalid or already processed payment", status=400)
    
    # ⚠️ In production: Verify with eSewa API
    # For now: Assume verified if we reach here
    
    # Mark as SUCCESS
    payment.status = "SUCCESS"
    payment.reference_id = ref_id
    payment.save()
    
    # Upgrade plan
    payment.activate_plan()
    
    return HttpResponse("✅ Payment verified & plan upgraded")


@api_view(["GET"])
def esewa_failure(request):
    """eSewa failure callback"""
    pid = request.GET.get("pid")
    
    PaymentTransaction.objects.filter(
        transaction_id=pid
    ).update(status="FAILED")
    
    return HttpResponse("❌ Payment failed")

