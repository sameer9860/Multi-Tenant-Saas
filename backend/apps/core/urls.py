from django.urls import path
from .views import test_org

urlpatterns = [
    path('test-org/', test_org),
]
