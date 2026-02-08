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
