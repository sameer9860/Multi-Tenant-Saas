from django.conf import settings
from django.contrib import admin


class ProductionSafeAdminMixin:
    """In production, only Django superusers may use the admin site."""

    def has_module_permission(self, request):
        if not settings.DEBUG and not request.user.is_superuser:
            return False
        return super().has_module_permission(request)

    def has_view_permission(self, request, obj=None):
        if not settings.DEBUG and not request.user.is_superuser:
            return False
        return super().has_view_permission(request, obj)

    def has_add_permission(self, request):
        if not settings.DEBUG and not request.user.is_superuser:
            return False
        return super().has_add_permission(request)

    def has_change_permission(self, request, obj=None):
        if not settings.DEBUG and not request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def has_delete_permission(self, request, obj=None):
        if not settings.DEBUG and not request.user.is_superuser:
            return False
        return super().has_delete_permission(request, obj)


class TenantScopedModelAdmin(ProductionSafeAdminMixin, admin.ModelAdmin):
    """
    Restrict admin list views to the staff user's organization.
    Superusers retain full visibility.

    Set ``tenant_lookup`` for related fields (e.g. ``invoice__organization``).
    """

    tenant_field = 'organization'
    tenant_lookup = None

    def _tenant_filter(self):
        return self.tenant_lookup or self.tenant_field

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        org = getattr(request.user, 'organization', None)
        if not org:
            return qs.none()
        lookup = self._tenant_filter()
        if lookup:
            return qs.filter(**{lookup: org})
        return qs

    def save_model(self, request, obj, form, change):
        field = self.tenant_field
        if (
            not change
            and field
            and hasattr(obj, field)
            and not getattr(obj, f'{field}_id', None)
            and getattr(request.user, 'organization', None)
        ):
            setattr(obj, field, request.user.organization)
        super().save_model(request, obj, form, change)
