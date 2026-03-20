from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
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
        queryset = Appointment.objects.filter(organization=self.request.user.organization)
        
        # Optional date range filtering
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        org = request.user.organization
        today = timezone.now().date()
        
        appointments = Appointment.objects.filter(organization=org)
        
        today_count = appointments.filter(date=today).count()
        upcoming_count = appointments.filter(date__gte=today, status='SCHEDULED').count()
        completed_count = appointments.filter(status='COMPLETED').count()
        cancelled_count = appointments.filter(status='CANCELLED').count()
        
        recent_appointments = appointments.order_by('-created_at')[:10]
        serializer = self.get_serializer(recent_appointments, many=True)
        
        return Response({
            'today_count': today_count,
            'upcoming_count': upcoming_count,
            'completed_count': completed_count,
            'cancelled_count': cancelled_count,
            'recent_appointments': serializer.data
        })
