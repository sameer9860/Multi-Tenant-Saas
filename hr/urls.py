from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmployeeViewSet, DepartmentViewSet, DesignationViewSet, 
    AttendanceViewSet, LeaveRequestViewSet, PayrollViewSet, SalaryAdvanceViewSet,
    HRDashboardView
)

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register(r'payrolls', PayrollViewSet, basename='payroll')
router.register(r'salary-advances', SalaryAdvanceViewSet, basename='salary-advance')


urlpatterns = [
    path('dashboard/', HRDashboardView.as_view(), name='hr-dashboard'),
    path('', include(router.urls)),
]
