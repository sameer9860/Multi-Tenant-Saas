from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        plan = org.subscription.plan

        limits = {
            "FREE": 10,
            "PRO": 1000,
            "BUSINESS": 10000,
        }

        used = org.invoices.count()

        return Response({
            "plan": plan,
            "used": used,
            "limit": limits.get(plan, 0),
            "remaining": limits.get(plan, 0) - used
        })
