from django.contrib import admin
from .models import User, OrganizationMember, Role


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "organization", "created_at")
    list_filter = ("organization",)
    search_fields = ("name", "organization__name")
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("email", "full_name", "organization", "role", "is_staff")
    list_filter = ("role", "organization", "is_staff")
    search_fields = ("email", "full_name")

@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "organization", "role", "created_at")
    list_filter = ("role", "organization")
    search_fields = ("user__email", "organization__name")
