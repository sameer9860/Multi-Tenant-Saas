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
        
        # Determine invoice limits based on plan
        invoice_limit = None
        if plan == "FREE":
            invoice_limit = 10
        elif plan == "BASIC":
            invoice_limit = 1000
        # PRO and others have unlimited invoices (None)

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
                    "limit": invoice_limit,
                }
            },
            # Flat fields for simple dashboard summary
            "leads_count": leads_count,
            "clients_count": clients_count,
            "invoices_count": invoices_count,
            "subscription_plan": plan,
        })

@login_required
def usage_dashboard(request):
        return render(request, "analytics/usage.html")
