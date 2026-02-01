from rest_framework.viewsets import ModelViewSet
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer

    def get_queryset(self):
        # Only invoices for the user's organization
        return Invoice.objects.filter(
            organization=self.request.organization
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.organization)
