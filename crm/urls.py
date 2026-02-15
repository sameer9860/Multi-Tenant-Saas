from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ClientViewSet, DashboardView

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"clients", ClientViewSet, basename="client")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
] + router.urls
