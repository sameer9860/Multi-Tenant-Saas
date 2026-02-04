from rest_framework.viewsets import ModelViewSet
from .models import Invoice
from apps.billing.utils import can_create_invoice
from rest_framework.exceptions import PermissionDenied
from .serializers import InvoiceSerializer
from rest_framework.permissions import IsAuthenticated
from apps.core.permissions import IsOwnerOrAdmin
from apps.core.models import Organization

class InvoiceViewSet(ModelViewSet):
    serializer_class = InvoiceSerializer
    queryset = Invoice.objects.all()

    def get_queryset(self):
        return Invoice.objects.filter(
            organization=self.request.organization
        )

    def perform_create(self, serializer):
        # Try middleware-provided organization first, then fallback to the authenticated user's organization.
        org = getattr(self.request, "organization", None)
        user = getattr(self.request, "user", None)

        if not org and user and getattr(user, "is_authenticated", False):
            org = getattr(user, "organization", None)

        if not org:
            # More explicit error for callers
            raise PermissionDenied("Organization not resolved. Ensure you are authenticated and your account is associated with an organization.")

        # billing check
        if not can_create_invoice(self.request):
            raise PermissionDenied(
                "Invoice limit reached. Please upgrade your plan."
            )
            
        invoice = serializer.save(organization=self.request.organization) 
        usage = self.request.organization.usage
        usage.invoices_created += 1
        usage.save()
            
            

        serializer.save(organization=org)