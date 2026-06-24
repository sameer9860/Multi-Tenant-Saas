from django.urls import path
from .views import test_org, health_check

urlpatterns = [
    path('test-org/', test_org),
    path('health/', health_check, name='health-check'),
]
