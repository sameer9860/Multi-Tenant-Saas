# apps/billing/urls.py

from django.urls import path
from .views import UsageDashboardAPIView, UsageDashboardView

urlpatterns = [
    path("usage/", UsageDashboardAPIView.as_view(), name="usage-dashboard"),
    path("usage/ui/", UsageDashboardView.as_view(), name="usage-dashboard-ui"),
]
