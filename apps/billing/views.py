from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import JSONParser, FormParser
from .serializers import UsageSerializer
from django.views.generic import TemplateView
from .models import PaymentTransaction
from .constants import PLAN_PRICES
from django.conf import settings
from .models import Payment
from rest_framework .decorators import api_view
from django.shortcuts import get_object_or_404,redirect
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.contrib.auth import authenticate, login
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy



class CustomLoginView(LoginView):
    template_name = 'billing/login.html'
    
    def get_success_url(self):
        return reverse_lazy('analytics:usage')


@login_required
def upgrade_view(request):
    return render(request, "billing/upgrade.html")

def usage_dashboard(request):
    return render(request, "billing/usage_dashboard.html")

def payment_success(request):
    return render(request, "billing/payment_success.html")

def payment_failed(request):
    return render(request, "billing/payment_failed.html")


class UpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        subscription = request.organization.subscription
        subscription.plan = plan
        subscription.save()
        return Response({"message": f"Upgraded to {plan}"})
    



class UsageDashboardAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # ensure a Usage record exists for the organization (and a Subscription)
        from .models import Usage, Subscription

        org = getattr(request, "organization", None)
        if org is None:
            return Response({"detail": "Organization not found"}, status=400)

        # create Usage if missing
        usage, _ = Usage.objects.get_or_create(organization=org)
        # ensure a subscription exists so serializer can access plan
        Subscription.objects.get_or_create(organization=org)

        serializer = UsageSerializer(usage)
        return Response(serializer.data)


class UsageDashboardView(TemplateView):
    template_name = "billing/usage_dashboard.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from .models import Usage, Subscription

        org = getattr(self.request, "organization", None)
        # If no organization is attached (e.g., anonymous request) show a friendly message
        if org is None:
            context.update({
                "plan": None,
                "invoices_used": 0,
                "invoice_limit": None,
                "invoice_percent": 0,
                "org_missing": True,
                "last_updated": None,
            })
            return context

        usage, _ = Usage.objects.get_or_create(organization=org)
        subscription, _ = Subscription.objects.get_or_create(organization=org)

        plan = subscription.plan
        invoice_limit = 10 if plan == "FREE" else 100
        invoices_used = usage.invoices_created
        invoice_percent = min(int((invoices_used / invoice_limit) * 100) if invoice_limit else 0, 100)

        context.update({
            "plan": plan,
            "invoices_used": invoices_used,
            "invoice_limit": invoice_limit,
            "invoice_percent": invoice_percent,
            "org_missing": False,
            "last_updated": usage.updated_at,
        })
        return context
    

class UpgradePlanAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        # Accept plan/provider from JSON, form-encoded body, or query params and normalize case
        plan_raw = (
            request.data.get("plan")
            or request.POST.get("plan")
            or request.query_params.get("plan")
        )
        provider_raw = (
            request.data.get("provider")
            or request.POST.get("provider")
            or request.query_params.get("provider")
        )

        if not plan_raw:
            return Response({"error": "plan is required"}, status=400)
        if not provider_raw:
            return Response({"error": "provider is required"}, status=400)

        plan = str(plan_raw).strip().upper()
        provider = str(provider_raw).strip().upper()

        if plan not in PLAN_PRICES:
            return Response({"error": "Invalid plan"}, status=400)

        if provider not in ["ESEWA", "KHALTI"]:
            return Response({"error": "Invalid provider"}, status=400)

        transaction = PaymentTransaction.objects.create(
            organization=request.organization,
            plan=plan,
            provider=provider,
            amount=PLAN_PRICES[plan],
        )

        return Response({
            "transaction_id": transaction.id,
            "amount": transaction.amount,
            "provider": provider,
        })
        
class EsewaVerifyAPIView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser, FormParser]

    def post(self, request):
        # Accept transaction id from several possible keys and locations
        transaction_id = (
            request.data.get("transaction_id")
            or request.data.get("transaction")
            or request.data.get("txn")
            or request.POST.get("transaction_id")
            or request.POST.get("transaction")
            or request.POST.get("txn")
            or request.query_params.get("transaction_id")
            or request.query_params.get("transaction")
            or request.query_params.get("txn")
        )
        if not transaction_id:
            return Response({"error": "transaction_id is required"}, status=400)

        # coerce to int where possible
        try:
            transaction_id_int = int(transaction_id)
        except (ValueError, TypeError):
            return Response({"error": "invalid transaction_id"}, status=400)

        try:
            tx = PaymentTransaction.objects.get(id=transaction_id_int)
        except PaymentTransaction.DoesNotExist:
            return Response({"error": "transaction not found"}, status=404)

        tx.status = "SUCCESS"
        tx.reference_id = (
            request.data.get("reference_id")
            or request.POST.get("reference_id")
            or request.query_params.get("reference_id")
            or "ESEWA_TEST_123"
        )
        tx.save()

        # Ensure a Subscription exists for this organization
        subscription = getattr(tx.organization, "subscription", None)
        if not subscription:
            from .models import Subscription
            subscription, _ = Subscription.objects.get_or_create(organization=tx.organization)

        subscription.plan = tx.plan
        subscription.save()

        return Response({"message": "Payment successful"})
        
        
class EsewaPaymentInit(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        organization = request.organization
        plan = request.data.get("plan")

        PLAN_PRICES = {
            "PRO": 1000,
            "BUSINESS": 3000,
        }

        if plan not in PLAN_PRICES:
            return Response({"error": "Invalid plan"}, status=400)

        payment = Payment.objects.create(
            organization=organization,
            amount=PLAN_PRICES[plan],
            plan=plan
        )

        return Response({
            "payment_url": settings.ESEWA_PAYMENT_URL,
            "data": {
                "amt": payment.amount,
                "pdc": 0,
                "psc": 0,
                "txAmt": 0,
                "tAmt": payment.amount,
                "pid": payment.id,
                "scd": settings.ESEWA_MERCHANT_CODE,
                "su": settings.ESEWA_SUCCESS_URL,
                "fu": settings.ESEWA_FAILURE_URL,
            }
        })
        
        
@api_view(["GET"])
def esewa_success(request):
    pid = request.GET.get("pid")
    refId = request.GET.get("refId")

    try:
        payment = Payment.objects.get(id=pid, status="PENDING")
    except Payment.DoesNotExist:
        return Response({"error": "Invalid payment"}, status=400)

    # ✅ Mark payment successful
    payment.transaction_id = refId
    payment.status = "SUCCESS"
    payment.save()

    # ✅ Upgrade organization plan
    org = payment.organization
    org.subscription.plan = payment.plan
    org.subscription.save()

    return redirect("/payment-success")        

@api_view(["GET"])
def esewa_failure(request):
    pid = request.GET.get("pid")

    Payment.objects.filter(id=pid).update(status="FAILED")
    return redirect("/payment-failed")

