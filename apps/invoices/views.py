from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied, ParseError, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework import parsers
import logging

from .models import Invoice, Customer, InvoiceItem, InvoicePayment
from .serializers import InvoiceSerializer, CustomerSerializer, InvoiceItemSerializer, InvoicePaymentSerializer

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
        # allow updates to paid_amount/total and recompute balance/status
        invoice = serializer.save()
        if invoice.paid_amount is not None:
            invoice.balance = invoice.total - invoice.paid_amount
            # Refined status logic
            if invoice.total > 0:
                if invoice.paid_amount >= invoice.total:
                    invoice.status = "PAID"
                elif invoice.paid_amount > 0:
                    invoice.status = "PARTIAL"
                else:
                    invoice.status = "DUE"
            else:
                # For 0 total, it's PAID if paid_amount > 0, else DUE
                invoice.status = "PAID" if invoice.paid_amount > 0 else "DUE"
            invoice.save()

    def perform_create(self, serializer):
        org = self.request.organization
        usage = org.usage

        # Check usage limits
        can_add, msg = usage.can_create_invoice()
        if not can_add:
            raise PermissionDenied(msg)

        # Save invoice initially (paid_amount may or may not be present)
        invoice = serializer.save(organization=org)

        if invoice.paid_amount is not None:
            invoice.balance = invoice.total - invoice.paid_amount
            # Refined status logic
            if invoice.total > 0:
                if invoice.paid_amount >= invoice.total:
                    invoice.status = "PAID"
                elif invoice.paid_amount > 0:
                    invoice.status = "PARTIAL"
                else:
                    invoice.status = "DUE"
            else:
                # For 0 total, it's PAID if paid_amount > 0, else DUE
                invoice.status = "PAID" if invoice.paid_amount > 0 else "DUE"
            invoice.save()

        # Increment usage count
        usage.increment_invoice_count()

    def create(self, request, *args, **kwargs):
        # log raw body for easier debugging
        logger.debug('Invoice create raw body: %s', request.body)
        try:
            return super().create(request, *args, **kwargs)
        except ParseError as exc:
            # wrap parse error with clearer message
            logger.error('JSON parsing failed for invoice creation: %s', exc)
            raise ValidationError({'detail': 'Request body contained invalid JSON'})

class InvoiceItemViewSet(ModelViewSet):
    serializer_class = InvoiceItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvoiceItem.objects.filter(invoice__organization=self.request.organization)

class InvoicePaymentViewSet(ModelViewSet):
    serializer_class = InvoicePaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return InvoicePayment.objects.filter(invoice__organization=self.request.organization)