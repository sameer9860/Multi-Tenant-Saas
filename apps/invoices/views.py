from rest_framework.viewsets import ModelViewSet
from .models import Invoice
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
        serializer.save(organization=self.request.organization)


