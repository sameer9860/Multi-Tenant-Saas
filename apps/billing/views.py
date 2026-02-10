from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view
from django.shortcuts import render, get_object_or_404
from django.views.generic import TemplateView, DetailView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy
from django.db import transaction
from django.conf import settings
from django.urls import reverse, reverse_lazy
from django.contrib import messages
import urllib.parse
import logging
import uuid
import re

logger = logging.getLogger(__name__)

from .models import PaymentTransaction, Payment, Usage, Subscription
from .constants import PLAN_PRICES, PLAN_LIMITS
from .payment_gateway import ESewaPaymentManager
from .serializers import PaymentTransactionSerializer
from django.http import HttpResponseRedirect, HttpResponse, Http404
from django.utils.http import urlencode
from django.views.decorators.csrf import csrf_exempt


class InitiateEsewaPaymentView(APIView):
    """Create PENDING transaction, redirect to eSewa"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        plan = request.data.get("plan")
        
        if plan not in PLAN_PRICES:
            return Response({"error": "Invalid plan"}, status=400)
        
        # Generate unique transaction ID
        transaction_id = str(uuid.uuid4())
        # Create PENDING transaction in DB (audit)
        payment = PaymentTransaction.objects.create(
            organization=request.organization,
            plan=plan,
            amount=PLAN_PRICES[plan],
            provider="ESEWA",
            transaction_id=transaction_id,
            status="PENDING"
        )

        # Also create a simple Payment record to represent the intent
        Payment.objects.create(
            organization=request.organization,
            amount=PLAN_PRICES[plan],
            plan=plan,
            transaction_id=transaction_id,
            status='PENDING'
        )
        
        # Build eSewa payment URL
        # build callback URLs using current request (safer across environments)
        success_url = request.build_absolute_uri('/billing/esewa/success/')
        failure_url = request.build_absolute_uri('/billing/esewa/failure/')

        params = {
            'amt': PLAN_PRICES[plan],
            'pdc': 0,
            'psc': 0,
            'txAmt': 0,
            # eSewa requires tAmt (total amount). Include it to avoid Bad Request.
            'tAmt': PLAN_PRICES[plan],
            'pid': transaction_id,
            'scd': getattr(settings, 'ESEWA_MERCHANT_CODE', 'EPAYTEST'),
            'su': success_url,
            'fu': failure_url,
        }

        # Use configured base URL so host can be changed via settings/env
        base = getattr(settings, 'ESEWA_BASE_URL', 'https://rc.esewa.com.np/epay/main')
        esewa_url = base + '?' + urllib.parse.urlencode(params)

        # Use local mock eSewa page only when explicitly enabled by setting
        if getattr(settings, 'ESEWA_USE_MOCK', False):
            mock_params = {
                'amt': params['amt'],
                'pid': params['pid'],
                'su': params['su'],
                'fu': params['fu'],
            }
            esewa_url = request.build_absolute_uri('/billing/mock/esewa/?' + urllib.parse.urlencode(mock_params))
        
        return Response({
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "esewa_url": esewa_url,
            "amount": PLAN_PRICES[plan],
            "plan": plan
        })


def _process_esewa_verification(payment, ref_id, amt=None):
    """
    Internal helper to verify payment with eSewa and upgrade plan.
    Returns: (status_code, response_message)
    """
    if payment.status == 'SUCCESS':
        return 200, "✅ Payment already processed"

    if payment.status == 'FAILED':
        return 400, "❌ Payment previously failed"

    # Perform verification with eSewa
    is_mock = getattr(settings, 'ESEWA_USE_MOCK', False) or (ref_id and str(ref_id).startswith('MOCK-'))

    if not is_mock:
        manager = ESewaPaymentManager()
        # Use raw amount if available from callback to avoid rounding/formatting issues
        expected_amount = amt or payment.amount
        result = manager.verify_payment(payment.transaction_id, amount=expected_amount, reference_id=ref_id)

        if not result.get('ok'):
            # Distinguish temporary verification failures
            msg = str(result.get('message') or '')
            if msg.startswith('request error') or msg.startswith('bad response'):
                logger.warning('eSewa verification deferred for pid=%s: %s', payment.transaction_id, msg)
                return 202, f"⚠️ Verification deferred: {msg}"

            # Hard failure: mark failed
            payment.status = 'FAILED'
            payment.reference_id = ref_id
            payment.save()
            Payment.objects.filter(transaction_id=payment.transaction_id).update(status='FAILED')
            return 400, f"❌ Verification failed: {msg}"

    # Verified or mock -> mark SUCCESS and activate
    with transaction.atomic():
        payment.status = 'SUCCESS'
        payment.reference_id = ref_id
        payment.save()
        Payment.objects.filter(transaction_id=payment.transaction_id).update(status='SUCCESS')
        payment.activate_plan()

    return 200, "✅ Payment verified & plan upgraded"


@api_view(["GET"])
def esewa_success(request):
    """eSewa success callback - VERIFY & UPGRADE"""
    ref_id = request.GET.get("refId")
    pid = request.GET.get("oid") or request.GET.get("pid")
    amt = request.GET.get('amt')

    # Try to find the transaction even if status isn't PENDING (handle idempotency)
    payment = None
    if pid:
        payment = PaymentTransaction.objects.filter(transaction_id=pid).first()

    if not payment:
        # fallback: maybe Payment model exists but no PaymentTransaction
        payment_record = Payment.objects.filter(transaction_id=pid).first()
        if payment_record:
            payment = PaymentTransaction.objects.filter(organization=payment_record.organization, amount=payment_record.amount).order_by('-created_at').first()

    if not payment:
        return HttpResponse("❌ Invalid or already processed payment", status=400)

    status_code, message = _process_esewa_verification(payment, ref_id, amt)
    if status_code == 200:
        messages.success(request, f"🎉 Success! Your plan has been upgraded to {payment.plan}.")
        return HttpResponseRedirect(reverse('usage-dashboard-ui'))
    return HttpResponse(message, status=status_code)


@api_view(["GET"])
def esewa_failure(request):
    """eSewa failure callback"""
    pid = request.GET.get("pid")
    PaymentTransaction.objects.filter(
        transaction_id=pid
    ).update(status="FAILED")

    Payment.objects.filter(transaction_id=pid).update(status='FAILED')

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

        # Create a Payment entry for audit/intent
        Payment.objects.create(
            organization=request.organization,
            amount=tx.amount,
            plan=tx.plan,
            transaction_id=tx.transaction_id,
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

        ref_id = request.data.get('reference_id') or 'ESEWA_CALLBACK_API'
        amt = request.data.get('amount')
        
        status_code, message = _process_esewa_verification(tx, ref_id, amt)
        
        if status_code == 200:
            return Response({"status": "SUCCESS", "plan": tx.plan, "message": message})
        elif status_code == 202:
            return Response({"status": "PENDING", "message": message}, status=202)
        else:
            return Response({"status": "FAILED", "error": message}, status=status_code)


def mock_esewa_view(request):
    """Render a local mock eSewa page for dev testing."""
    amt = request.GET.get('amt')
    pid = request.GET.get('pid')
    su = request.GET.get('su')
    fu = request.GET.get('fu')

    pay_url = request.build_absolute_uri('/billing/mock/esewa/pay/')
    return render(request, 'billing/mock_esewa.html', {
        'amt': amt,
        'pid': pid,
        'su': su,
        'fu': fu,
        'pay_url': pay_url,
    })


@csrf_exempt
def mock_esewa_pay(request):
    """Handle mock payment action and redirect to success/failure callback."""
    if request.method != 'POST':
        return HttpResponse('Method not allowed', status=405)

    action = request.POST.get('action')
    pid = request.POST.get('pid')
    # amt intentionally unused in mock handler
    su = request.POST.get('su')
    fu = request.POST.get('fu')

    # Build redirect url (include pid and a mock refId)
    if action == 'success' and su:
        params = {'pid': pid, 'refId': f'MOCK-{pid[:8]}'}
        return HttpResponseRedirect(su + ('&' if '?' in su else '?') + urlencode(params))

    if fu:
        params = {'pid': pid}
        return HttpResponseRedirect(fu + ('&' if '?' in fu else '?') + urlencode(params))

    return HttpResponse('No callback configured', status=400)


# ========== Payment History & Receipts =============

class PaymentListAPIView(APIView):
    """API to return payment history for the current organization"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = PaymentTransaction.objects.filter(
            organization=request.organization
        ).order_by('-created_at')
        serializer = PaymentTransactionSerializer(payments, many=True)
        return Response(serializer.data)


class PaymentHistoryView(LoginRequiredMixin, TemplateView):
    """UI for payment history"""
    template_name = 'billing/payment_history.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['payments'] = PaymentTransaction.objects.filter(
            organization=self.request.organization
        ).order_by('-created_at')
        return context


class ReceiptView(LoginRequiredMixin, DetailView):
    """Detailed view for a single payment receipt"""
    model = PaymentTransaction
    template_name = 'billing/receipt.html'
    context_object_name = 'payment'

    def get_object(self, queryset=None):
        obj = super().get_object(queryset)
        # Security: ensure payment belongs to user's organization
        if obj.organization != self.request.organization:
            raise Http404("Receipt not found")
        return obj

