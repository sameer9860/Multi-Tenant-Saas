from rest_framework.exceptions import PermissionDenied

class TenantScopedViewSetMixin:
    """
    Mixin for viewsets that automatically filters querysets by organization
    and injects organization into the validated data during creation.
    
    Attributes:
        tenant_lookup_field (str): The lookup path to the organization field. Defaults to 'organization'.
    """
    tenant_lookup_field = 'organization'

    def get_organization(self):
        # Retrieve the tenant/organization attached to the request or fall back to user's organization.
        return getattr(self.request, 'organization', None) or getattr(self.request.user, 'organization', None)

    def get_queryset(self):
        org = self.get_organization()
        if not org:
            # If no organization is associated, return an empty queryset.
            return self.queryset.none()
        
        # Apply the organization filter dynamically.
        filter_kwargs = {self.tenant_lookup_field: org}
        return super().get_queryset().filter(**filter_kwargs)

    def perform_create(self, serializer):
        # Check if the serializer expects organization or if we need to manually pass it.
        # Typically, for creation, if the model has a direct organization field, we save it.
        org = self.get_organization()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        if self.tenant_lookup_field == 'organization':
            serializer.save(organization=org)
        else:
            serializer.save()
