from django.urls import path
from .views import ProfileView, SwitchOrganizationView

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('switch-org/', SwitchOrganizationView.as_view(), name='switch-org'),
]
