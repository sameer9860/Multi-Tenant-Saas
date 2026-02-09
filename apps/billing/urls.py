# apps/billing/urls.py

from django.urls import path
from .views import (
    UsageDashboardAPIView, UsageDashboardView, UpgradePlanAPIView,
    EsewaVerifyAPIView, InitiateEsewaPaymentView, esewa_success, esewa_failure, 
    payment_failed, payment_success, upgrade_view, CustomLoginView
)

urlpatterns = [
    path("login/", CustomLoginView.as_view(), name="login"),
    path("usage/", UsageDashboardAPIView.as_view(), name="usage-dashboard"),    
    path("usage/ui/", UsageDashboardView.as_view(), name="usage-dashboard-ui"),
    path("", UsageDashboardView.as_view(), name="usage-dashboard-ui"),
    path("upgrade/", UpgradePlanAPIView.as_view(), name="upgrade-plan"),
    path("upgrade/ui/", upgrade_view, name="upgrade-plan-ui"),
    
    # eSewa endpoints
    path("esewa/verify/", EsewaVerifyAPIView.as_view(), name="esewa-verify"),
    path("esewa/init/", InitiateEsewaPaymentView.as_view(), name="esewa-init"),
    path("esewa/success/", esewa_success, name="esewa-success"),
    path("esewa/failure/", esewa_failure, name="esewa-failure"),
    # Local mock gateway for development/testing
    path("mock/esewa/", "apps.billing.views.mock_esewa_view", name="mock-esewa"),
    path("mock/esewa/pay/", "apps.billing.views.mock_esewa_pay", name="mock-esewa-pay"),
    
    # Payment status pages
    path("payment/success/", payment_success, name="payment-success"),
    path("payment/failed/", payment_failed, name="payment-failed"),
]
