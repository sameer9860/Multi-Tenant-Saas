# apps/billing/urls.py

from django.urls import path
from .views import UsageDashboardAPIView

urlpatterns = [
    path("usage/", UsageDashboardAPIView.as_view(), name="usage-dashboard"),
]
