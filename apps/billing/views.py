from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import UsageSerializer
from django.views.generic import TemplateView
from .models import PaymentTransaction
from .constants import PLAN_PRICES
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

    def post(self, request):
        plan = request.data.get("plan")
        provider = request.data.get("provider")

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