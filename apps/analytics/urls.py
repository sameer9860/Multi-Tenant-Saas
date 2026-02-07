from django.urls import path
from .views import UsageView,usage_dashboard

app_name = 'analytics'

urlpatterns = [
    path("usage/", UsageView.as_view(), name="usage"),
    path("usage/dashboard/", usage_dashboard, name="usage-dashboard"),
]
