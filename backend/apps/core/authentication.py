from rest_framework_simplejwt.authentication import JWTAuthentication


class OrganizationJWTAuthentication(JWTAuthentication):
    """JWT authentication that attaches the user's organization to the request.

    This solves the problem where middleware runs before authentication and
    `request.organization` is None for token-authenticated requests.
    """

    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            # Nothing authenticated
            return None

        user, token = result

        # Attach organization and role if available; allow other code to rely on it
        org = getattr(user, "organization", None)
        request.organization = org
        
        # Determine role
        from apps.accounts.models import OrganizationMember
        member = OrganizationMember.objects.filter(user=user, organization=org).first()
        request.user_role = member.role if member else getattr(user, 'role', 'STAFF')

        return (user, token)
