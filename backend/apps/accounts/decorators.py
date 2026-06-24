"""
DEPRECATED — use apps.core.permissions permission classes instead.
This decorator is no longer used anywhere in the codebase.
Kept to avoid import errors during transition; will be removed in a future cleanup.
"""
import logging
from django.http import HttpResponseForbidden
from functools import wraps
from apps.core.roles import get_user_role_name

logger = logging.getLogger(__name__)


def require_role(allowed_roles):
    """
    Deprecated: use IsOwnerOrAdmin / IsPayrollManager / IsOwnerAdminOrAccountant
    from apps.core.permissions instead.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            org = getattr(request, 'organization', None)
            user_role = get_user_role_name(request)

            if not org:
                logger.warning("Permission denied for %s: Organization context missing.", request.user)
                return HttpResponseForbidden("Organization context missing.")

            if user_role:
                if user_role in [r.upper() for r in allowed_roles]:
                    return view_func(request, *args, **kwargs)
                logger.warning(
                    "Permission denied for %s in %s: role %s not in %s.",
                    request.user, org.name, user_role, allowed_roles
                )
                return HttpResponseForbidden(f"Permission denied. Insufficient role {user_role}.")

            from .models import OrganizationMember
            try:
                member = OrganizationMember.objects.get(user=request.user, organization=org)
                if member.role in allowed_roles:
                    return view_func(request, *args, **kwargs)
                return HttpResponseForbidden("Permission denied. Insufficient role.")
            except OrganizationMember.DoesNotExist:
                return HttpResponseForbidden("Permission denied. Not a member of this organization.")

        return wrapper
    return decorator
