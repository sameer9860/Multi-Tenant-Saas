from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ParseError, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework import parsers
import logging

from .models import Invoice, Customer, InvoiceItem, Payment
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import (
    InvoiceSerializer, CustomerSerializer, InvoiceItemSerializer, 
    PaymentSerializer, CustomerLedgerSerializer
)

logger = logging.getLogger(__name__)

class CustomerViewSet(ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.FormParser]

    def get_queryset(self):
        return Customer.objects.filter(organization=self.request.organization)

    def perform_create(self, serializer):
        org = self.request.organization
        usage = org.usage

        # Check usage limits
        can_add, msg = usage.can_add_customer()
        if not can_add:
            raise PermissionDenied(msg)

        # Save customer
        serializer.save(organization=org)

        # Increment usage count
        usage.increment_customer_count()

    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        customer = self.get_object()
        invoices = customer.invoices.all().order_by('date')
        
        ledger_entries = []
        total_invoiced = 0
        total_paid = 0
        
        for invoice in invoices:
            ledger_entries.append({
                "date": invoice.date,
                "type": "Invoice",
                "description": f"Invoice {invoice.invoice_number}",
                "debit": invoice.total,
                "credit": 0,
            })
            total_invoiced += invoice.total
            
            for payment in invoice.payments.all():
                ledger_entries.append({
                    "date": payment.date,
                    "type": "Payment",
                    "description": f"Payment for {invoice.invoice_number} ({payment.reference or 'N/A'})",
                    "debit": 0,
                    "credit": payment.amount,
                })
                total_paid += payment.amount
        
        # Sort by date
        ledger_entries.sort(key=lambda x: x["date"])
        
        # Calculate running balance
        running_balance = 0
        for entry in ledger_entries:
            running_balance += (entry["debit"] - entry["credit"])
            entry["balance"] = running_balance
            
        summary = {
            "total_invoiced": total_invoiced,
            "total_paid": total_paid,
            "current_balance": running_balance,
        }
        
        serializer = CustomerLedgerSerializer({
            "summary": summary,
            "entries": ledger_entries
        })
        return Response(serializer.data)

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    # allow form-data fallback in case request isn't strict JSON
    parser_classes = [parsers.JSONParser, parsers.FormParser]

    def get_queryset(self):
        # include customer in queryset so serializer can efficiently serialize nested data
        return Invoice.objects.filter(
            organization=self.request.organization
        ).select_related('customer').prefetch_related('items', 'payments')

    def perform_update(self, serializer):
        serializer.save()

    def perform_create(self, serializer):
        org = self.request.organization
        usage = org.usage

        # Check usage limits
        can_add, msg = usage.can_create_invoice()
        if not can_add:
            raise PermissionDenied(msg)

        # Save invoice (model handles initial payment if provided)
        serializer.save(organization=org)

        # Increment usage count
        usage.increment_invoice_count()

    def create(self, request, *args, **kwargs):
        # log raw body for easier debugging
        logger.debug('Invoice create raw body: %s', request.body)
        try:
            return super().create(request, *args, **kwargs)
        except ParseError as exc:
            logger.error('JSON parsing failed for invoice creation: %s', exc)
            raise ValidationError({'detail': 'Request body contained invalid JSON'})

    def destroy(self, request, *args, **kwargs):
        user_role = getattr(request, 'user_role', 'STAFF')
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied("Only Owners or Admins can delete invoices.")
        return super().destroy(request, *args, **kwargs)

class InvoiceItemViewSet(ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__organization=self.request.organization)

class PaymentViewSet(ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(organization=self.request.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.organization)