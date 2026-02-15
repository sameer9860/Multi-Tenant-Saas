from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Lead, Client
from .serializers import LeadSerializer, ClientSerializer
from .permissions import IsAdminOrReadOnly, IsAdminOwnerOrStaffUpdate
from apps.subscriptions.limits import PLAN_LIMITS


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated, IsAdminOwnerOrStaffUpdate]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        return Lead.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        plan = org.plan  # Organization model has a 'plan' field

        limit = PLAN_LIMITS.get(plan, {}).get("leads")

        if limit is not None and org.leads.count() >= limit:
            raise PermissionDenied("Lead limit reached. Upgrade your plan.")

        serializer.save(organization=org)


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        return Client.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)

        if not org:
            raise PermissionDenied("User is not associated with an organization.")

        plan = org.plan

        limit = PLAN_LIMITS.get(plan, {}).get("clients")

        if limit is not None and org.clients.count() >= limit:
            raise PermissionDenied("Client limit reached. Upgrade your plan.")

        serializer.save(organization=org)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure user has an organization
        org = getattr(request, 'organization', None) or getattr(request.user, 'organization', None)
        
        if not org:
            return Response(
                {"error": "User is not associated with an organization"}, 
                status=400
            )

        total_leads = org.leads.count()
        total_clients = org.clients.count()
        
        # Helper to safely get counts
        def safe_count(queryset):
            return queryset.count() if queryset is not None else 0

        total_invoices = safe_count(getattr(org, 'invoices', None))

        status_counts = {
            "NEW": org.leads.filter(status="NEW").count(),
            "CONTACTED": org.leads.filter(status="CONTACTED").count(),
            "CONVERTED": org.leads.filter(status="CONVERTED").count(),
            "LOST": org.leads.filter(status="LOST").count(),
        }

        conversion_rate = 0
        if total_leads > 0:
            conversion_rate = (status_counts["CONVERTED"] / total_leads) * 100

        # Get plan usage details from PLAN_LIMITS in apps.subscriptions.limits
        # or from Usage model if available. 
        # Based on previous files, Usage model exists in apps.billing.models
        
        usage_leads = total_leads
        limit_leads = -1
        
        usage_clients = total_clients
        limit_clients = -1
        
        usage_invoices = 0
        limit_invoices = -1

        # Try to get limits from PLAN_LIMITS directly if available (imported in views.py)
        # from apps.subscriptions.limits import PLAN_LIMITS
        current_plan = org.plan
        if current_plan in PLAN_LIMITS:
            limit_leads = PLAN_LIMITS[current_plan].get("leads", -1)
            limit_clients = PLAN_LIMITS[current_plan].get("clients", -1)

        # Get usage from Usage model for invoices
        if hasattr(org, 'usage'):
            usage_invoices = org.usage.invoices_created
            limit_invoices = org.usage.get_plan_limit('invoices')

        usage_data = {
            "leads": {
                "used": usage_leads,
                "limit": limit_leads
            },
            "clients": {
                "used": usage_clients,
                "limit": limit_clients
            },
            "invoices": {
                "used": usage_invoices,
                "limit": limit_invoices
            }
        }

        return Response({
            "total_leads": total_leads,
            "total_clients": total_clients,
            "total_invoices": total_invoices,
            "status_counts": status_counts,
            "conversion_rate": conversion_rate,
            "plan": current_plan,
            "usage": usage_data,
            "organization_name": org.name
        })
