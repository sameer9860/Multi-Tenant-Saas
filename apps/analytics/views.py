from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

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
@login_required
def usage_dashboard(request):
        return render(request, "analytics/usage.html")
