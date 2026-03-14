from rest_framework import viewsets, permissions
from .models import Service
from .serializers import ServiceSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter services by the user's organization
        return Service.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        # Ensure organization is set during creation (as a backup to serializer logic)
        serializer.save(organization=self.request.user.organization)
