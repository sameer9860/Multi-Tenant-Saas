from django.urls import path
from .views import UpgradePlanView

app_name = 'subscriptions'

urlpatterns = [
    path('upgrade/', UpgradePlanView.as_view(), name='upgrade_plan'),
]
