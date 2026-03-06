from rest_framework import viewsets, pagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import models

from .models import Employee, Department, Designation
from .serializers import EmployeeSerializer, DepartmentSerializer, DesignationSerializer


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
