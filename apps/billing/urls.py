# apps/billing/urls.py

from django.urls import path
from .views import UsageDashboardAPIView, UsageDashboardView,UpgradePlanAPIView,EsewaVerifyAPIView,EsewaPaymentInit,esewa_success,esewa_failure

urlpatterns = [
    path("usage/", UsageDashboardAPIView.as_view(), name="usage-dashboard"),    
    path("usage/ui/", UsageDashboardView.as_view(), name="usage-dashboard-ui"),
    path("upgrade/", UpgradePlanAPIView.as_view(), name="upgrade-plan"),
    path("esewa/verify/", EsewaVerifyAPIView.as_view(), name="esewa-verify"),
    path("esewa/init/", EsewaPaymentInit.as_view()),
    path("esewa/success/", esewa_success),
    path("esewa/failure/", esewa_failure),
]
