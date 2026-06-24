from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.billing.models import Subscription
from apps.billing.constants import PLAN_PRICES
from apps.billing.utils import get_esewa_merchant_code
import uuid
import urllib.parse
from django.conf import settings


class UpgradePlanView(APIView):
    """
    POST /api/subscription/upgrade/

    FREE downgrades apply immediately.
    Paid plans require eSewa payment — plan only activates after callback confirms payment.
    Trial users cannot switch to paid plans for free.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = (request.data.get("plan") or "").strip().upper()

        if plan not in PLAN_PRICES:
            return Response(
                {"error": f"Invalid plan. Choose from {list(PLAN_PRICES.keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        organization = getattr(request, 'organization', None)
        if not organization:
            return Response({"error": "Organization not found."}, status=status.HTTP_403_FORBIDDEN)

        subscription, _ = Subscription.objects.get_or_create(organization=organization)

        # FREE downgrade — apply immediately, no payment needed
        if plan == "FREE":
            subscription.plan = "FREE"
            subscription.is_trial = False
            subscription.save(update_fields=['plan', 'is_trial'])
            organization.plan = "FREE"
            organization.save(update_fields=["plan"])
            return Response({"message": "Moved to FREE plan.", "plan": "FREE"})

        # Paid plan — always require payment (blocks trial free upgrades too)
        from apps.billing.models import PaymentTransaction, Payment

        transaction_id = str(uuid.uuid4())
        amount = PLAN_PRICES[plan]

        PaymentTransaction.objects.create(
            organization=organization,
            plan=plan,
            amount=amount,
            provider="ESEWA",
            transaction_id=transaction_id,
            status="PENDING",
        )
        Payment.objects.create(
            organization=organization,
            amount=amount,
            plan=plan,
            transaction_id=transaction_id,
            status="PENDING",
        )

        success_url = request.build_absolute_uri('/api/billing/esewa/success/')
        failure_url = request.build_absolute_uri('/api/billing/esewa/failure/')

        params = {
            'amt': amount, 'pdc': 0, 'psc': 0, 'txAmt': 0,
            'tAmt': amount, 'pid': transaction_id,
            'scd': get_esewa_merchant_code(),
            'su': success_url, 'fu': failure_url,
        }

        base = getattr(settings, 'ESEWA_BASE_URL', 'https://rc-epay.esewa.com.np/epay/main')
        esewa_url = base + '?' + urllib.parse.urlencode(params)

        if getattr(settings, 'ESEWA_USE_MOCK', False):
            mock_params = {
                'amt': params['amt'], 'pid': params['pid'],
                'su': params['su'], 'fu': params['fu'],
            }
            esewa_url = request.build_absolute_uri(
                '/api/billing/mock/esewa/?' + urllib.parse.urlencode(mock_params)
            )

        return Response({
            "requires_payment": True,
            "esewa_url": esewa_url,
            "transaction_id": transaction_id,
            "amount": amount,
            "plan": plan,
        })
