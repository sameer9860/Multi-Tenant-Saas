from rest_framework.viewsets import ModelViewSet
from .models import Invoice
from apps.billing.utils import can_create_invoice
from rest_framework.exceptions import PermissionDenied
from .serializers import InvoiceSerializer
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsOwnerOrAdmin

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        return Invoice.objects.filter(
            organization=self.request.organization
        )

    def perform_create(self, serializer):
        if not can_create_invoice(self.request):
            raise PermissionDenied(
                "Invoice limit reached. Please upgrade your plan."
            )

        serializer.save(organization=self.request.organization)