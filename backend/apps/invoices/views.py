from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ParseError, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework import parsers, pagination
import logging
from decimal import Decimal
from django.http import HttpResponse
from .utils import generate_invoice_pdf
from apps.core.mixins import TenantScopedViewSetMixin
from apps.core.permissions import IsOwnerOrAdmin

from .models import Invoice, Customer, InvoiceItem, Payment
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import (
    InvoiceSerializer, CustomerSerializer, InvoiceItemSerializer,
    PaymentSerializer, CustomerLedgerSerializer
)

logger = logging.getLogger(__name__)


class InvoicePagination(pagination.PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class CustomerViewSet(TenantScopedViewSetMixin, ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.FormParser]
    pagination_class = InvoicePagination

    def get_queryset(self):
        queryset = super().get_queryset().select_related('organization').order_by('-created_at')
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        org = self.get_organization()
        usage = org.usage

        can_add, msg = usage.can_add_customer()
        if not can_add:
            raise PermissionDenied(msg)

        super().perform_create(serializer)
        usage.increment_customer_count()

    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        try:
            customer = self.get_object()
            invoices = customer.invoices.all().order_by('date')

            ledger_entries = []
            total_invoiced = Decimal('0.00')
            total_paid = Decimal('0.00')

            for invoice in invoices:
                ledger_entries.append({
                    "date": invoice.date,
                    "type": "Invoice",
                    "description": f"Invoice {invoice.invoice_number}",
                    "debit": invoice.total,
                    "credit": Decimal('0.00'),
                })
                total_invoiced += invoice.total

                for payment in invoice.payments.all():
                    ledger_entries.append({
                        "date": payment.date,
                        "type": "Payment",
                        "description": f"Payment for {invoice.invoice_number} ({payment.reference or 'N/A'})",
                        "debit": Decimal('0.00'),
                        "credit": payment.amount,
                    })
                    total_paid += payment.amount

            ledger_entries.sort(key=lambda x: (x["date"], 0 if x["type"] == "Invoice" else 1))

            running_balance = Decimal('0.00')
            for entry in ledger_entries:
                running_balance += (entry["debit"] - entry["credit"])
                entry["balance"] = running_balance

            summary = {
                "total_invoiced": float(total_invoiced),
                "total_paid": float(total_paid),
                "current_balance": float(running_balance),
            }

            serializer = CustomerLedgerSerializer({
                "summary": summary,
                "entries": ledger_entries
            })
            return Response(serializer.data)
        except Exception:
            logger.exception("Error generating ledger for customer %s", pk)
            return Response({"error": "Unable to generate customer ledger."}, status=500)


class InvoiceViewSet(TenantScopedViewSetMixin, ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.FormParser]
    pagination_class = InvoicePagination

    def get_permissions(self):
        if self.action == 'destroy':
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset().select_related(
            'customer', 'organization'
        ).prefetch_related('items', 'payments')

        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        org = self.get_organization()
        usage = org.usage

        can_add, msg = usage.can_create_invoice()
        if not can_add:
            raise PermissionDenied(msg)

        super().perform_create(serializer)
        usage.increment_invoice_count()

    def create(self, request, *args, **kwargs):
        logger.debug('Invoice create raw body: %s', request.body)
        try:
            return super().create(request, *args, **kwargs)
        except ParseError as exc:
            logger.error('JSON parsing failed for invoice creation: %s', exc)
            raise ValidationError({'detail': 'Request body contained invalid JSON'})

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_content = generate_invoice_pdf(invoice)

        response = HttpResponse(content_type='application/pdf')
        filename = f"Invoice_{invoice.invoice_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response


class InvoiceItemViewSet(TenantScopedViewSetMixin, ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]
    tenant_lookup_field = 'invoice__organization'


class PaymentViewSet(TenantScopedViewSetMixin, ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = InvoicePagination

    def get_queryset(self):
        queryset = super().get_queryset().select_related('invoice', 'organization')
        invoice_id = self.request.query_params.get('invoice')
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        return queryset.order_by('-created_at')
