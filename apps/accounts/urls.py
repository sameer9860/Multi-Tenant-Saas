from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProfileView, SwitchOrganizationView, OrganizationMemberViewSet

router = DefaultRouter()
router.register(r'members', OrganizationMemberViewSet, basename='member')

urlpatterns = [
    path('profile/', ProfileView.as_view(), name='profile'),
    path('switch-org/', SwitchOrganizationView.as_view(), name='switch-org'),
    path('', include(router.urls)),
]
