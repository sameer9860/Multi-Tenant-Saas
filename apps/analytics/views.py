from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from apps.subscriptions.limits import PLAN_LIMITS

class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        if not org:
             return Response({"error": "Organization not found"}, status=404)
             
        plan = org.plan # Use org.plan if available or org.subscription.plan
        
        leads_count = org.leads.count()
        clients_count = org.clients.count()
        invoices_count = org.invoices.count()
        
        limits = PLAN_LIMITS.get(plan, {})

        return Response({
            "plan": plan,
            "organization_name": org.name,
            "usage": {
                "leads": {
                    "used": leads_count,
                    "limit": limits.get("leads"),
                },
                "clients": {
                    "used": clients_count,
                    "limit": limits.get("clients"),
                },
                "invoices": {
                    "used": invoices_count,
                    "limit": 10 if plan == "FREE" else 1000 if plan == "BASIC" else None, # Legacy invoice limits
                }
            },
            # Flat fields for simple dashboard summary
            "leads_count": leads_count,
            "clients_count": clients_count,
        })
@login_required
def usage_dashboard(request):
        return render(request, "analytics/usage.html")
