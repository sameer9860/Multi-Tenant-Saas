from rest_framework import viewsets, pagination
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from rest_framework.decorators import action
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder, Tag

from apps.invoices.models import Invoice, Customer, Payment
from .serializers import (
    LeadSerializer, ClientSerializer, LeadActivitySerializer, 
    ExpenseSerializer, NoteSerializer, InteractionSerializer, ReminderSerializer,
    TagSerializer
)

from .permissions import IsAdminOrReadOnly, IsAdminOwnerOrStaffUpdate
from apps.subscriptions.limits import PLAN_LIMITS


class LeadPagination(pagination.PageNumberPagination):
    page_size = 25

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('no_pagination') == 'true':
            return None
        return super().paginate_queryset(queryset, request, view)

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    pagination_class = LeadPagination
    permission_classes = [IsAuthenticated, IsAdminOwnerOrStaffUpdate]



    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        queryset = Lead.objects.filter(organization=org)

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(phone__icontains=search)
            )

        return queryset.order_by('-created_at')



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
        old_assignee = lead.assigned_to

        updated_lead = serializer.save()
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)

        # Log Status Change
        if old_status != updated_lead.status:
            LeadActivity.objects.create(
                organization=org,
                lead=updated_lead,
                user=self.request.user,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=updated_lead.status
            )
        
        # Log Assignee Change
        if old_assignee != updated_lead.assigned_to:
            LeadActivity.objects.create(
                organization=org,
                lead=updated_lead,
                user=self.request.user,
                action="REASSIGNED",
                old_value=str(old_assignee) if old_assignee else "None",
                new_value=str(updated_lead.assigned_to) if updated_lead.assigned_to else "None"
            )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def convert_to_customer(self, request, pk=None):
        lead = self.get_object()
        org = lead.organization
        
        if lead.status == "CONVERTED":
            return Response({"error": "Lead is already converted"}, status=400)
            
        # Create Customer in invoices app
        customer = Customer.objects.create(
            organization=org,
            name=lead.name,
            email=lead.email,
            phone=lead.phone
        )
        
        # Update Lead status
        old_status = lead.status
        lead.status = "CONVERTED"
        lead.save()
        
        # Log Activity
        LeadActivity.objects.create(
            organization=org,
            lead=lead,
            user=request.user,
            action="CONVERTED_TO_CUSTOMER",
            old_value=old_status,
            new_value="CONVERTED"
        )
        
        return Response({
            "status": "Lead converted successfully",
            "customer_id": customer.id
        })

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_update(self, request):
        ids = request.data.get('ids', [])
        status = request.data.get('status')
        assigned_to_id = request.data.get('assigned_to')
        
        if not ids:
            return Response({"error": "No lead IDs provided"}, status=400)
            
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        leads = Lead.objects.filter(id__in=ids, organization=org)
        
        updated_count = 0
        for lead in leads:
            old_status = lead.status
            old_assignee = lead.assigned_to
            
            changed = False
            if status and old_status != status:
                lead.status = status
                changed = True
                LeadActivity.objects.create(
                    organization=org,
                    lead=lead,
                    user=self.request.user,
                    action="STATUS_CHANGED_BULK",
                    old_value=old_status,
                    new_value=status
                )
                
            if assigned_to_id is not None:
                new_assignee = User.objects.filter(id=assigned_to_id).first()
                if old_assignee != new_assignee:
                    lead.assigned_to = new_assignee
                    changed = True
                    LeadActivity.objects.create(
                        organization=org,
                        lead=lead,
                        user=self.request.user,
                        action="REASSIGNED_BULK",
                        old_value=str(old_assignee) if old_assignee else "None",
                        new_value=str(new_assignee) if new_assignee else "None"
                    )
            
            if changed:
                lead.save()
                updated_count += 1
                
        return Response({"status": f"Successfully updated {updated_count} leads"})

class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        return Tag.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        serializer.save(organization=org)




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

        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

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


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        return Expense.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)

class NoteViewSet(viewsets.ModelViewSet):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        queryset = Note.objects.filter(organization=org)
        lead_id = self.request.query_params.get('lead')
        client_id = self.request.query_params.get('client')
        customer_id = self.request.query_params.get('customer')
        
        if lead_id: queryset = queryset.filter(lead_id=lead_id)
        if client_id: queryset = queryset.filter(client_id=client_id)
        if customer_id: queryset = queryset.filter(customer_id=customer_id)
        
        return queryset

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org, user=self.request.user)

class InteractionViewSet(viewsets.ModelViewSet):
    serializer_class = InteractionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        queryset = Interaction.objects.filter(organization=org)
        
        lead_id = self.request.query_params.get('lead')
        client_id = self.request.query_params.get('client')
        customer_id = self.request.query_params.get('customer')
        
        if lead_id: queryset = queryset.filter(lead_id=lead_id)
        if client_id: queryset = queryset.filter(client_id=client_id)
        if customer_id: queryset = queryset.filter(customer_id=customer_id)
        
        return queryset.order_by('-date')

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org, user=self.request.user)

class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        queryset = Reminder.objects.filter(organization=org)
        
        if self.request.query_params.get('completed') == 'true':
            queryset = queryset.filter(is_completed=True)
        elif self.request.query_params.get('completed') == 'false':
            queryset = queryset.filter(is_completed=False)
            
        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        return queryset.order_by('remind_at')

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org, user=self.request.user)


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
        # Unifying CRM Clients and Invoice Customers into one count
        crm_clients_count = org.clients.count()
        invoice_customers_count = Customer.objects.filter(organization=org).count()
        total_clients = crm_clients_count + invoice_customers_count
        
        # Helper to safely get counts
        def safe_count(queryset):
            return queryset.count() if queryset is not None else 0

        # Analytics specific aggregations for Dashboard
        # Fetching Total Invoices
        total_invoices = Invoice.objects.filter(organization=org).count()
        
        # Keep separate total_customers for now, but total_clients is now unified
        total_customers = invoice_customers_count

        # Fetching Total Revenue (Sum of all Payment amounts)
        total_revenue_agg = Payment.objects.filter(
            organization=org
        ).aggregate(total=Sum("amount"))
        total_revenue = total_revenue_agg["total"] or 0

        # Fetching Total Due Amount (Sum of 'balance' for all invoices)
        total_due_agg = Invoice.objects.filter(
            organization=org
        ).aggregate(due=Sum("balance"))
        total_due = total_due_agg["due"] or 0

        # Fetching Monthly Revenue (Sum of all Payment amounts grouped by month)
        monthly_revenue_data = (
            Payment.objects.filter(organization=org)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
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
            "INTERESTED": org.leads.filter(status="INTERESTED").count(),
            "CONVERTED": org.leads.filter(status="CONVERTED").count(),
            "LOST": org.leads.filter(status="LOST").count(),
        }

        # Fetching Total Expenses
        total_expense_agg = Expense.objects.filter(
            organization=org
        ).aggregate(total=Sum("amount"))
        total_expenses = total_expense_agg["total"] or 0

        # Calculating Profit
        total_profit = float(total_revenue) - float(total_expenses)

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
            "total_expenses": float(total_expenses),
            "total_profit": total_profit,
            "total_due": float(total_due),
            "monthly_revenue": monthly_revenue,
            "status_counts": status_counts,
            "conversion_rate": conversion_rate,
            "plan": current_plan,
            "usage": usage_data,
            "organization_name": org.name
        })
