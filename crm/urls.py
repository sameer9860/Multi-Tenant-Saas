from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ClientViewSet, DashboardView, LeadActivityViewSet, ExpenseViewSet

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"activities", LeadActivityViewSet, basename="activity")
router.register(r"expenses", ExpenseViewSet, basename="expense")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
] + router.urls
