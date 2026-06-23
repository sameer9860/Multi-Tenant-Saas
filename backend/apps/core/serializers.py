"""Shared serializer utilities."""


def get_request_organization(request):
    return getattr(request, 'organization', None) or getattr(
        getattr(request, 'user', None), 'organization', None
    )


def filter_queryset_by_organization(queryset, request):
    org = get_request_organization(request)
    if not org:
        return queryset.none()
    return queryset.filter(organization=org)
