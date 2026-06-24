from rest_framework_simplejwt.authentication import JWTAuthentication


class OrganizationJWTAuthentication(JWTAuthentication):
    """JWT authentication that attaches the user's organization and role to the request.

    Fixes:
    - Removed duplicate OrganizationMember DB query (TenantMiddleware already does this).
    - Simply attaches org from user FK — middleware handles the full member lookup.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result

        # Attach org directly from user — TenantMiddleware will do the full
        # OrganizationMember lookup and set request.user_role properly.
        request.organization = getattr(user, 'organization', None)
        request.user_role = getattr(user, 'role', None)

        return (user, token)
