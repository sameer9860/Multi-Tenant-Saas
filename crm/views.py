from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from .models import Lead, Client, LeadActivity
from apps.invoices.models import Invoice, Customer
from .serializers import LeadSerializer, ClientSerializer, LeadActivitySerializer
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

        lead = serializer.save(organization=org)

        LeadActivity.objects.create(
            organization=org,
            lead=lead,
            user=self.request.user,
            action="CREATED"
        )

    def perform_update(self, serializer):
        lead = self.get_object()
        old_status = lead.status

        updated_lead = serializer.save()

        if old_status != updated_lead.status:
            org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
            LeadActivity.objects.create(
                organization=org,
                lead=updated_lead,
                user=self.request.user,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=updated_lead.status
            )



class LeadActivityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LeadActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        user = self.request.user
        queryset = LeadActivity.objects.filter(organization=org)

        # Smart Improvement: Staff only see their assigned leads' activities
        user_role_obj = getattr(user, 'role', None)
        user_role = user_role_obj.name if hasattr(user_role_obj, 'name') else user_role_obj
        
        if user_role == 'STAFF':
            queryset = queryset.filter(lead__assigned_to=user)

        return queryset.order_by("-created_at")


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
        total_clients = org.clients.count() # CRM Clients
        
        # Helper to safely get counts
        def safe_count(queryset):
            return queryset.count() if queryset is not None else 0

        # Analytics specific aggregations for Dashboard
        # Fetching Total Invoices
        total_invoices = Invoice.objects.filter(organization=org).count()
        
        # Fetching Total Customers (from Invoice app)
        total_customers = Customer.objects.filter(organization=org).count()

        # Fetching Total Revenue (Sum of 'total' for PAID invoices)
        total_revenue_agg = Invoice.objects.filter(
            organization=org, 
            status="PAID"
        ).aggregate(total=Sum("total"))
        total_revenue = total_revenue_agg["total"] or 0

        # Fetching Total Due Amount (Sum of 'balance' for all invoices)
        total_due_agg = Invoice.objects.filter(
            organization=org
        ).aggregate(due=Sum("balance"))
        total_due = total_due_agg["due"] or 0

        # Fetching Monthly Revenue
        monthly_revenue_data = (
            Invoice.objects.filter(organization=org, status="PAID")
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Sum("total"))
            .order_by("month")
        )
        # Convert month dates to string format for JSON serialization
        monthly_revenue = [
            {
                "month": item["month"].strftime("%Y-%m") if item["month"] else None,
                "total": item["total"] or 0
            }
            for item in monthly_revenue_data
        ]

        status_counts = {
            "NEW": org.leads.filter(status="NEW").count(),
            "CONTACTED": org.leads.filter(status="CONTACTED").count(),
            "CONVERTED": org.leads.filter(status="CONVERTED").count(),
            "LOST": org.leads.filter(status="LOST").count(),
        }

        conversion_rate = 0
        if total_leads > 0:
            conversion_rate = (status_counts["CONVERTED"] / total_leads) * 100

        # Get plan usage details
        usage_leads = total_leads
        limit_leads = -1
        
        usage_clients = total_clients
        limit_clients = -1
        
        usage_invoices = 0
        limit_invoices = None

        current_plan = org.plan
        if current_plan in PLAN_LIMITS:
            limit_leads = PLAN_LIMITS[current_plan].get("leads", -1)
            limit_clients = PLAN_LIMITS[current_plan].get("clients", -1)
        
        from apps.billing.constants import PLAN_LIMITS as BILLING_LIMITS
        plan_invoice_limit = BILLING_LIMITS.get(current_plan, {}).get('invoices', None)

        if hasattr(org, 'usage'):
            usage_invoices = org.usage.invoices_created
            limit_invoices = org.usage.get_plan_limit('invoices')
            if limit_invoices == -1:
                limit_invoices = None

        if limit_invoices is None:
            limit_invoices = plan_invoice_limit

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
            "total_customers": total_customers,
            "total_revenue": float(total_revenue),
            "total_due": float(total_due),
            "monthly_revenue": monthly_revenue,
            "status_counts": status_counts,
            "conversion_rate": conversion_rate,
            "plan": current_plan,
            "usage": usage_data,
            "organization_name": org.name
        })
