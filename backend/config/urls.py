"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)


class TokenRateThrottle(AnonRateThrottle):
    """Dedicated tight throttle for login/refresh endpoints."""
    scope = 'token'


class ThrottledTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [TokenRateThrottle]


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_classes = [TokenRateThrottle]


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/core/', include('apps.core.urls')),
    path('api/', include('apps.invoices.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/subscription/', include('apps.subscriptions.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/appointments/', include('appointments.urls')),
    re_path(r'^api/token/?$', ThrottledTokenObtainPairView.as_view(), name='token_obtain_pair'),
    re_path(r'^api/token/refresh/?$', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    re_path(r'^api/token/blacklist/?$', TokenBlacklistView.as_view(), name='token_blacklist'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
