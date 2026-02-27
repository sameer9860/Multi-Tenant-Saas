from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ParseError, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework import parsers
import logging
from decimal import Decimal
from django.http import HttpResponse
from .utils import generate_invoice_pdf

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
            
            # Sort by date, then by type (Invoices before Payments on same day)
            ledger_entries.sort(key=lambda x: (x["date"], 0 if x["type"] == "Invoice" else 1))
            
            # Calculate running balance
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
        except Exception as e:
            logger.exception("Error generating ledger for customer %s", pk)
            return Response({"error": str(e)}, status=500)

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    # allow form-data fallback in case request isn't strict JSON
    parser_classes = [parsers.JSONParser, parsers.FormParser]

    def get_queryset(self):
        # include customer in queryset so serializer can efficiently serialize nested data
        return Invoice.objects.filter(
            organization=self.request.organization
        ).select_related('customer', 'organization').prefetch_related('items', 'payments')

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

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        invoice = self.get_object()
        pdf_content = generate_invoice_pdf(invoice)
        
        response = HttpResponse(content_type='application/pdf')
        filename = f"Invoice_{invoice.invoice_number}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write(pdf_content)
        return response

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