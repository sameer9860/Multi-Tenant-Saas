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
from apps.core.mixins import TenantScopedViewSetMixin
from .permissions import IsAdminOrReadOnly, IsAdminOwnerOrStaffUpdate
from apps.billing.constants import PLAN_LIMITS   # unified source of truth
from apps.core.roles import get_user_role_name


class LeadPagination(pagination.PageNumberPagination):
    page_size = 25

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('no_pagination') == 'true':
            return None
        return super().paginate_queryset(queryset, request, view)


# ---------------------------------------------------------------------------
# Shared mixin for Note / Interaction / Reminder viewsets
# ---------------------------------------------------------------------------

class CrmRelatedObjectMixin:
    """
    Shared get_queryset + perform_create for Note, Interaction, Reminder.
    Subclasses must define `filter_params` — a list of query param names
    that map directly to FK field names on the model.
    """
    filter_params = []   # e.g. ['lead', 'client', 'customer']

    def get_queryset(self):
        queryset = super().get_queryset()
        for param in self.filter_params:
            value = self.request.query_params.get(param)
            if value:
                queryset = queryset.filter(**{f'{param}_id': value})
        return queryset

    def perform_create(self, serializer):
        org = self.get_organization()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org, user=self.request.user)


# ---------------------------------------------------------------------------
# ViewSets
# ---------------------------------------------------------------------------

class LeadViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    pagination_class = LeadPagination
    permission_classes = [IsAuthenticated, IsAdminOwnerOrStaffUpdate]

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'assigned_to', 'organization'
        ).prefetch_related('tags')
    # ... rest unchanged


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
        org = self.get_organization()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")

        limit = PLAN_LIMITS.get(org.plan, {}).get("leads")
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
        org = self.get_organization()

        if old_status != updated_lead.status:
            LeadActivity.objects.create(
                organization=org,
                lead=updated_lead,
                user=self.request.user,
                action="STATUS_CHANGED",
                old_value=old_status,
                new_value=updated_lead.status
            )

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

        customer = Customer.objects.create(
            organization=org,
            name=lead.name,
            email=lead.email,
            phone=lead.phone
        )

        old_status = lead.status
        lead.status = "CONVERTED"
        lead.save()

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

        org = self.get_organization()
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
                new_assignee = None
                if assigned_to_id:
                    new_assignee = User.objects.filter(
                        id=assigned_to_id,
                        organization_memberships__organization=org,
                    ).first()
                    if not new_assignee:
                        return Response(
                            {"error": "Assigned user must be a member of your organization."},
                            status=400,
                        )
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


class TagViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class LeadActivityViewSet(TenantScopedViewSetMixin, viewsets.ReadOnlyModelViewSet):
    queryset = LeadActivity.objects.all()
    serializer_class = LeadActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        user_role = get_user_role_name(self.request)
        if user_role == 'STAFF':
            queryset = queryset.filter(lead__assigned_to=user)

        lead_id = self.request.query_params.get('lead')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)

        return queryset.order_by("-created_at")


class ClientViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def perform_create(self, serializer):
        org = self.get_organization()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")

        limit = PLAN_LIMITS.get(org.plan, {}).get("clients")
        if limit is not None and org.clients.count() >= limit:
            raise PermissionDenied("Client limit reached. Upgrade your plan.")

        serializer.save(organization=org)


class ExpenseViewSet(TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class NoteViewSet(CrmRelatedObjectMixin, TenantScopedViewSetMixin, viewsets.ModelViewSet):
    def get_queryset(self):
        return super().get_queryset().select_related(
            'user', 'lead', 'client', 'customer', 'organization'
        )
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_params = ['lead', 'client', 'customer']


class InteractionViewSet(CrmRelatedObjectMixin, TenantScopedViewSetMixin, viewsets.ModelViewSet):
    def get_queryset(self):
        return super().get_queryset().select_related(
            'user', 'lead', 'client', 'customer', 'organization'
        ).order_by('-date')

    serializer_class = InteractionSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_params = ['lead', 'client', 'customer']

    def get_queryset(self):
        return super().get_queryset().order_by('-date')


class ReminderViewSet(CrmRelatedObjectMixin, TenantScopedViewSetMixin, viewsets.ModelViewSet):
    queryset = Reminder.objects.all()
    serializer_class = ReminderSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_params = ['lead']

    def get_queryset(self):
        queryset = super().get_queryset()

        completed = self.request.query_params.get('completed')
        if completed == 'true':
            queryset = queryset.filter(is_completed=True)
        elif completed == 'false':
            queryset = queryset.filter(is_completed=False)

        return queryset.order_by('remind_at')


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = getattr(request, 'organization', None)

        if not org:
            return Response(
                {"error": "User is not associated with an organization"},
                status=400
            )

        total_leads = org.leads.count()
        crm_clients_count = org.clients.count()
        invoice_customers_count = Customer.objects.filter(organization=org).count()
        total_clients = crm_clients_count + invoice_customers_count
        total_invoices = Invoice.objects.filter(organization=org).count()
        total_customers = invoice_customers_count

        total_revenue = Payment.objects.filter(organization=org).aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_due = Invoice.objects.filter(organization=org).aggregate(
            due=Sum("balance")
        )["due"] or 0

        monthly_revenue_data = (
            Payment.objects.filter(organization=org)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("amount"))
            .order_by("month")
        )
        monthly_revenue = [
            {
                "month": item["month"].strftime("%Y-%m") if item["month"] else None,
                "total": item["total"] or 0
            }
            for item in monthly_revenue_data
        ]

        from django.db.models import Count, Case, When, IntegerField
        status_agg = org.leads.aggregate(
            NEW=Count(Case(When(status="NEW", then=1), output_field=IntegerField())),
            CONTACTED=Count(Case(When(status="CONTACTED", then=1), output_field=IntegerField())),
            INTERESTED=Count(Case(When(status="INTERESTED", then=1), output_field=IntegerField())),
            CONVERTED=Count(Case(When(status="CONVERTED", then=1), output_field=IntegerField())),
            LOST=Count(Case(When(status="LOST", then=1), output_field=IntegerField())),
        )
        status_counts = status_agg

        total_expenses = Expense.objects.filter(organization=org).aggregate(
            total=Sum("amount")
        )["total"] or 0

        total_profit = float(total_revenue) - float(total_expenses)
        conversion_rate = (
            (status_counts["CONVERTED"] / total_leads) * 100 if total_leads > 0 else 0
        )

        current_plan = org.plan
        plan_limits = PLAN_LIMITS.get(current_plan, {})

        def _limit(val):
            """None (unlimited) stays None; -1 also becomes None for the API."""
            return None if val in (None, -1) else val

        usage_invoices = 0
        limit_invoices = _limit(plan_limits.get('invoices'))
        if hasattr(org, 'usage'):
            usage_invoices = org.usage.invoices_created
            raw = org.usage.get_plan_limit('invoices')
            limit_invoices = _limit(raw)

        usage_data = {
            "leads":    {"used": total_leads,   "limit": _limit(plan_limits.get("leads"))},
            "clients":  {"used": total_clients,  "limit": _limit(plan_limits.get("clients"))},
            "invoices": {"used": usage_invoices, "limit": limit_invoices},
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
            "organization_name": org.name,
        })
