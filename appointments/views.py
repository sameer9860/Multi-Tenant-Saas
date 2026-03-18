from rest_framework import viewsets, permissions
from .models import Service, Staff, StaffAvailability, Appointment
from .serializers import ServiceSerializer, StaffSerializer, StaffAvailabilitySerializer, AppointmentSerializer

class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter services by the user's organization
        return Service.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        # Ensure organization is set during creation (as a backup to serializer logic)
        serializer.save(organization=self.request.user.organization)

class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Staff.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class StaffAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = StaffAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter by the user's organization through the staff model
        return StaffAvailability.objects.filter(staff__organization=self.request.user.organization)

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Appointment.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
