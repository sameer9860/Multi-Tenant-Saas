from django.contrib import admin
from apps.core.admin_mixins import TenantScopedModelAdmin
from .models import Organization


@admin.register(Organization)
class OrganizationAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'slug', 'plan', 'email', 'created_at')
    search_fields = ('name', 'slug', 'email')
