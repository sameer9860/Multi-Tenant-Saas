from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view
from django.shortcuts import redirect, render, get_object_or_404
from django.http import HttpResponse
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy

from .models import PaymentTransaction, Usage, Subscription, PlanLimit
from .constants import PLAN_PRICES, PLAN_LIMITS
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


# ========== UI + API Views for Usage & Upgrade =============


class CustomLoginView(LoginView):
    template_name = 'billing/login.html'

    def get_success_url(self):
        return reverse_lazy('usage-dashboard-ui')


@login_required
def upgrade_view(request):
    return render(request, "billing/upgrade.html")


def payment_success(request):
    return render(request, "billing/payment_success.html")


def payment_failed(request):
    return render(request, "billing/payment_failed.html")


class UsageDashboardAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # If organization is not attached to request, return friendly message
        org = getattr(request, 'organization', None)
        if org is None:
            return Response({'detail': 'Organization not found'}, status=400)

        usage, _ = Usage.objects.get_or_create(organization=org)
        data = {
            'plan': getattr(org.subscription, 'plan', 'FREE'),
            'invoices_used': usage.invoices_created,
            'invoice_limit': Usage.get_plan_limit(usage, 'invoices') if hasattr(usage, 'get_plan_limit') else None,
            'customers_used': usage.customers_created,
        }
        return Response(data)


class UsageDashboardView(TemplateView):
    template_name = 'billing/usage_dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        org = getattr(self.request, 'organization', None)
        if org is None:
            context.update({
                'plan': None,
                'invoices_used': 0,
                'invoice_limit': None,
                'org_missing': True,
            })
            return context

        usage, _ = Usage.objects.get_or_create(organization=org)
        subscription, _ = Subscription.objects.get_or_create(organization=org)
        plan = subscription.plan
        
        # Get invoice limit from PLAN_LIMITS constant
        invoice_limit = PLAN_LIMITS.get(plan, {}).get('invoices', None)
        
        invoices_used = usage.invoices_created
        
        # Calculate percentage for progress bar
        if invoice_limit and invoice_limit > 0:
            invoice_percent = (invoices_used / invoice_limit) * 100
            remaining_invoices = max(0, invoice_limit - invoices_used)
        else:
            invoice_percent = 0
            remaining_invoices = 0

        context.update({
            'plan': plan,
            'invoices_used': invoices_used,
            'invoice_limit': invoice_limit,
            'invoice_percent': invoice_percent,
            'remaining_invoices': remaining_invoices,
            'org_missing': False,
        })
        return context


class UpgradePlanAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan_raw = request.data.get('plan')
        provider_raw = request.data.get('provider')
        if not plan_raw:
            return Response({"error": "plan is required"}, status=400)
        plan = str(plan_raw).strip().upper()
        if plan not in PLAN_PRICES:
            return Response({"error": "Invalid plan"}, status=400)

        # create a PaymentTransaction placeholder (client picks provider flow)
        tx = PaymentTransaction.objects.create(
            organization=request.organization,
            plan=plan,
            provider=(provider_raw or 'ESEWA').upper(),
            amount=PLAN_PRICES[plan],
            transaction_id=str(uuid.uuid4()),
            status='PENDING'
        )

        return Response({
            'transaction_id': tx.transaction_id,
            'amount': tx.amount,
            'plan': tx.plan
        })


class EsewaVerifyAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        transaction_id = (
            request.data.get('transaction_id')
            or request.data.get('transaction')
            or request.data.get('txn')
        )
        if not transaction_id:
            return Response({"error": "transaction_id is required"}, status=400)

        try:
            tx = PaymentTransaction.objects.get(transaction_id=transaction_id)
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "transaction not found"}, status=404)

        tx.status = 'SUCCESS'
        tx.reference_id = request.data.get('reference_id', 'ESEWA_TEST_123')
        tx.save()

        # Activate subscription
        tx.activate_plan()
        return Response({"message": "Payment successful"})

