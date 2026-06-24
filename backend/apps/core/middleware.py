from django.utils import timezone


class TenantMiddleware:
    """
    Middleware to attach organization and role to every request.
    Subscription expiry is checked at most once per hour per org
    to avoid a DB write on every single request.
    """
    # In-process cache: org_id -> last checked timestamp
    _expiry_checked: dict = {}
    EXPIRY_CHECK_INTERVAL_SECONDS = 3600  # 1 hour

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
            # No legacy fallback — unverified members get no org on the request.

            if request.organization:
                self._maybe_check_expiry(request.organization)

        response = self.get_response(request)
        return response

    def _maybe_check_expiry(self, org):
        """Only call check_expiry() once per hour per org, not on every request."""
        org_key = str(org.pk)
        now = timezone.now().timestamp()
        last_checked = self.__class__._expiry_checked.get(org_key, 0)

        if now - last_checked >= self.EXPIRY_CHECK_INTERVAL_SECONDS:
            try:
                org.subscription.check_expiry()
                self.__class__._expiry_checked[org_key] = now
            except Exception:
                pass

        