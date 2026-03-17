from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, StaffViewSet, StaffAvailabilityViewSet

router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'staff', StaffViewSet, basename='staff')
router.register(r'staff-availability', StaffAvailabilityViewSet, basename='staff-availability')

urlpatterns = [
    path('', include(router.urls)),
]
