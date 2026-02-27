from django.urls import path
from .views import UsageView, usage_dashboard, VATSummaryView, MonthlyReportView

app_name = 'analytics'

urlpatterns = [
    path("usage/", UsageView.as_view(), name="usage"),
    path("usage/dashboard/", usage_dashboard, name="usage-dashboard"),
    path("reports/vat/", VATSummaryView.as_view(), name="vat-summary"),
    path("reports/monthly/", MonthlyReportView.as_view(), name="monthly-report"),
]
