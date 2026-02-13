from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.shortcuts import render

class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        if not org:
             return Response({"error": "Organization not found"}, status=404)
             
        plan = org.plan # Use org.plan if available or org.subscription.plan
        
        leads_count = org.leads.count()
        clients_count = org.clients.count()

        return Response({
            "plan": plan,
            "leads_count": leads_count,
            "clients_count": clients_count,
            "organization_name": org.name
        })
@login_required
def usage_dashboard(request):
        return render(request, "analytics/usage.html")
