from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Sum
from .models import Service, Staff, StaffAvailability, Appointment
from .serializers import ServiceSerializer, StaffSerializer, StaffAvailabilitySerializer, AppointmentSerializer
from collections import defaultdict


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
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
        return StaffAvailability.objects.filter(staff__organization=self.request.user.organization)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Appointment.objects.filter(organization=self.request.user.organization)

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

    @action(detail=False, methods=['get'])
    def reports(self, request):
        org = request.user.organization
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        appointments = Appointment.objects.filter(organization=org)
        if start_date:
            appointments = appointments.filter(date__gte=start_date)
        if end_date:
            appointments = appointments.filter(date__lte=end_date)

        # 1. Appointments per day — use Python aggregation for SQLite compatibility
        # (TruncDate uses a user-defined function that fails on some SQLite builds)
        day_counts = defaultdict(int)
        for appt in appointments.values('date'):
            day_counts[str(appt['date'])] += 1
        appointments_per_day = [
            {'day': day, 'count': count}
            for day, count in sorted(day_counts.items())
        ]

        # 2. Appointments per staff
        appointments_per_staff = list(
            appointments.values('staff__name').annotate(count=Count('id')).order_by('-count')
        )

        # 3. Revenue per service (only completed)
        revenue_per_service = list(
            appointments.filter(status='COMPLETED')
            .values('service__name')
            .annotate(total_revenue=Sum('service__price'))
            .order_by('-total_revenue')
        )
        # Convert Decimal to float for clean JSON serialization
        for item in revenue_per_service:
            if item['total_revenue'] is not None:
                item['total_revenue'] = float(item['total_revenue'])

        # 4. Cancellation rate
        total_count = appointments.count()
        cancelled_count = appointments.filter(status='CANCELLED').count()
        cancellation_rate = round((cancelled_count / total_count * 100), 2) if total_count > 0 else 0

        # 5. Total revenue (completed only)
        total_revenue = appointments.filter(
            status='COMPLETED'
        ).aggregate(total=Sum('service__price'))['total'] or 0

        return Response({
            'appointments_per_day': appointments_per_day,
            'appointments_per_staff': appointments_per_staff,
            'revenue_per_service': revenue_per_service,
            'metrics': {
                'total_appointments': total_count,
                'cancelled_appointments': cancelled_count,
                'cancellation_rate': cancellation_rate,
                'total_revenue': float(total_revenue),
            }
        })
