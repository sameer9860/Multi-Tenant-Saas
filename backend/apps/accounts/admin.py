from django.contrib import admin
from apps.core.admin_mixins import TenantScopedModelAdmin
from .models import User, OrganizationMember, Role


@admin.register(Role)
class RoleAdmin(TenantScopedModelAdmin):
    list_display = ("name", "organization", "created_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")


@admin.register(User)
class UserAdmin(TenantScopedModelAdmin):
    list_display = ("email", "full_name", "organization", "role", "is_staff")
    list_filter = ("role", "organization", "is_staff")
    search_fields = ("email", "full_name")


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(TenantScopedModelAdmin):
    list_display = ("user", "organization", "role", "created_at")
    list_filter = ("role", "organization")
    search_fields = ("user__email", "organization__name")
