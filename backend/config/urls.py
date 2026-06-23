"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

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
    # allow both `/api/token` and `/api/token/` (optional trailing slash)
    re_path(r'^api/token/?$', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    re_path(r'^api/token/refresh/?$', TokenRefreshView.as_view(), name='token_refresh'),
]

from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
