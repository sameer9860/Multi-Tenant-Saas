from rest_framework.exceptions import PermissionDenied


class TenantScopedViewSetMixin:
    """
    Mixin for viewsets that automatically filters querysets by organization.
    Relies on TenantMiddleware having set request.organization.
    No fallback to request.user.organization — that bypasses middleware security.
    """
    tenant_lookup_field = 'organization'

    def get_organization(self):
        return getattr(self.request, 'organization', None)


    def get_queryset(self):
        org = self.get_organization()
        if not org:
            return self.queryset.none()
        filter_kwargs = {self.tenant_lookup_field: org}
        return super().get_queryset().filter(**filter_kwargs)

    def perform_create(self, serializer):
        org = self.get_organization()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        if self.tenant_lookup_field == 'organization':
            serializer.save(organization=org)
        else:
            serializer.save()
