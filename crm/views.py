from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Lead, Client
from .serializers import LeadSerializer, ClientSerializer


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Lead.objects.filter(
            organization=self.request.organization
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.organization
        )


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Client.objects.filter(
            organization=self.request.organization
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.organization
        )
