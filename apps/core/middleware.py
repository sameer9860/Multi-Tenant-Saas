class TenantMiddleware:
    """
    Middleware to attach organization to every request
    based on the logged-in user. Also enforces subscription expiry.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Default organization and role = None
        request.organization = None
        request.user_role = None

        if request.user.is_authenticated:
            # First satisfy the Step 2 requirement: Determine org via OrganizationMember
            from apps.accounts.models import OrganizationMember
            try:
                # We prioritize the active organization link on the User model
                # but verify it exists in memberships.
                member = OrganizationMember.objects.filter(
                    user=request.user, 
                    organization=request.user.organization
                ).first()
                
                if member:
                    request.organization = member.organization
                    request.user_role = member.role
                else:
                    # Fallback for existing users without membership records yet
                    request.organization = request.user.organization
                    request.user_role = getattr(request.user, 'role', 'STAFF')
            except Exception:
                # Basic fallback
                request.organization = request.user.organization
                request.user_role = getattr(request.user, 'role', 'STAFF')

            # Enforce subscription expiry / trial expiry on every request
            if request.organization:
                try:
                    subscription = request.organization.subscription
                    subscription.check_expiry()
                except Exception:
                    pass  # No subscription yet — safe to ignore

        response = self.get_response(request)
        return response
