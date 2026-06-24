class TenantMiddleware:
    """
    Middleware to attach organization to every request
    based on the logged-in user. Also enforces subscription expiry.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.organization = None
        request.user_role = None

        if request.user.is_authenticated:
            from apps.accounts.models import OrganizationMember

            member = OrganizationMember.objects.filter(
                user=request.user,
                organization=request.user.organization,
            ).select_related('organization', 'role').first()

            if member:
                request.organization = member.organization
                request.user_role = member.role
            # Legacy fallback removed: users without an OrganizationMember row
            # get no org on the request. Views using get_organization() will
            # raise PermissionDenied cleanly instead of silently granting access.

            if request.organization:
                try:
                    subscription = request.organization.subscription
                    subscription.check_expiry()
                except Exception:
                    pass

        response = self.get_response(request)
        return response
