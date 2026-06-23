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
        organization = getattr(request, 'organization', None)
        if not organization and request.user.is_authenticated:
            organization = request.user.organization
        subscription, _ = Subscription.objects.get_or_create(organization=organization)

        # Trial Upgrade Logic: Users on active trial can switch to any plan for free
        # System will auto-downgrade when trial ends if payment not made
        from django.utils import timezone
        if subscription.is_trial and subscription.is_active and subscription.trial_end and subscription.trial_end > timezone.now():
            subscription.plan = plan
            subscription.save()
            organization.plan = plan
            organization.save()
            return Response({"message": f"Successfully switched to {plan} during trial", "plan": plan})
        
        # If upgrading to FREE (downgrade), we can do it immediately or handle it separately
        # But usually users want to upgrade TO a paid plan.
        from apps.billing.constants import PLAN_PRICES
        from apps.billing.views import InitiateEsewaPaymentView
        import uuid
        from django.conf import settings
        import urllib.parse
        from apps.billing.models import PaymentTransaction, Payment

        if plan == "FREE" or PLAN_PRICES.get(plan, 0) == 0:
            subscription.plan = "FREE"
            subscription.save()
            organization.plan = "FREE"
            organization.save()
            return Response({"message": "Successfully moved to FREE plan", "plan": "FREE"})

        # For paid plans, initiate eSewa payment
        transaction_id = str(uuid.uuid4())
        amount = PLAN_PRICES[plan]
        
        # Create PENDING transaction
        PaymentTransaction.objects.create(
            organization=organization,
            plan=plan,
            amount=amount,
            provider="ESEWA",
            transaction_id=transaction_id,
            status="PENDING"
        )
        
        Payment.objects.create(
            organization=organization,
            amount=amount,
            plan=plan,
            transaction_id=transaction_id,
            status='PENDING'
        )

        success_url = request.build_absolute_uri('/billing/esewa/success/')
        failure_url = request.build_absolute_uri('/billing/esewa/failure/')

        params = {
            'amt': amount,
            'pdc': 0,
            'psc': 0,
            'txAmt': 0,
            'tAmt': amount,
            'pid': transaction_id,
            'scd': getattr(settings, 'ESEWA_MERCHANT_CODE', 'EPAYTEST'),
            'su': success_url,
            'fu': failure_url,
        }

        base = getattr(settings, 'ESEWA_BASE_URL', 'https://rc-epay.esewa.com.np/epay/main')
        esewa_url = base + '?' + urllib.parse.urlencode(params)

        if getattr(settings, 'ESEWA_USE_MOCK', False):
            mock_params = {
                'amt': params['amt'],
                'pid': params['pid'],
                'su': params['su'],
                'fu': params['fu'],
            }
            esewa_url = request.build_absolute_uri('/billing/mock/esewa/?' + urllib.parse.urlencode(mock_params))

        return Response({
            "requires_payment": True,
            "esewa_url": esewa_url,
            "transaction_id": transaction_id,
            "amount": amount,
            "plan": plan
        })
