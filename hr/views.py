from rest_framework import viewsets, pagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import models

from .models import Employee, Department, Designation, Attendance
from .serializers import (
    EmployeeSerializer, DepartmentSerializer, 
    DesignationSerializer, AttendanceSerializer
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Attendance.objects.filter(organization=org)

        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)

        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)

        return queryset.order_by('-date', 'employee__full_name')

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        
        records = request.data.get('records', [])
        date = request.data.get('date')
        
        if not date or not records:
            return Response(
                {"error": "Date and records are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        created_count = 0
        updated_count = 0
        
        for record in records:
            employee_id = record.get('employee')
            status_val = record.get('status')
            notes = record.get('notes', '')
            
            attendance, created = Attendance.objects.update_or_create(
                organization=org,
                employee_id=employee_id,
                date=date,
                defaults={
                    'status': status_val,
                    'notes': notes
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return Response({
            "message": f"Successfully processed {len(records)} records.",
            "created": created_count,
            "updated": updated_count
        })



class EmployeePagination(pagination.PageNumberPagination):
    page_size = 25

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('no_pagination') == 'true':
            return None
        return super().paginate_queryset(queryset, request, view)


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Department.objects.filter(organization=org).annotate(
            employee_count=models.Count('employees')
        )
        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)


class DesignationViewSet(viewsets.ModelViewSet):
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Designation.objects.filter(organization=org).annotate(
            employee_count=models.Count('employees')
        )
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
            
        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    pagination_class = EmployeePagination
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Employee.objects.filter(organization=org)

        # Status filter
        status = self.request.query_params.get('status')
        if status and status != 'ALL':
            queryset = queryset.filter(status=status)

        # Department filter
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(full_name__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(phone__icontains=search)
                | models.Q(department__name__icontains=search)
                | models.Q(designation__name__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)
