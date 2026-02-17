from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from .models import Invoice, Customer, InvoiceItem, InvoicePayment
from .serializers import InvoiceSerializer, CustomerSerializer, InvoiceItemSerializer, InvoicePaymentSerializer

class CustomerViewSet(ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Customer.objects.filter(organization=self.request.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.organization)

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Invoice.objects.filter(
            organization=self.request.organization
        ).prefetch_related('items', 'payments')

    def perform_create(self, serializer):
        org = self.request.organization
        usage = org.usage

        # Check usage limits
        can_add, msg = usage.can_create_invoice()
        if not can_add:
            raise PermissionDenied(msg)

        # Save invoice
        invoice = serializer.save(organization=org)

        # Increment usage count
        usage.increment_invoice_count()

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