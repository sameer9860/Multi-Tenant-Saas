import logging
from django.http import HttpResponseForbidden
from functools import wraps

logger = logging.getLogger(__name__)

def require_role(allowed_roles):
    """
    Decorator to restrict view access based on OrganizationMember role.
    Example usage: @require_role(["OWNER", "ADMIN"])
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Try to get organizational context from middleware
            org = getattr(request, 'organization', None)
            user_role = getattr(request, 'user_role', None)

            if not org:
                logger.warning(f"Permission denied for {request.user}: Organization context missing.")
                return HttpResponseForbidden("Organization context missing.")
            
            # Use user_role from middleware if available, otherwise check DB
            if user_role:
                if user_role in allowed_roles:
                    return view_func(request, *args, **kwargs)
                else:
                    logger.warning(f"Permission denied for {request.user} in {org.name}: Insufficient role {user_role}. Required: {allowed_roles}")
                    return HttpResponseForbidden(f"Permission denied. Insufficient role {user_role}.")
            
            # Fallback for direct DB check (if middleware didn't set role)
            from .models import OrganizationMember
            try:
                member = OrganizationMember.objects.get(
                    user=request.user,
                    organization=org
                )
                if member.role in allowed_roles:
                    return view_func(request, *args, **kwargs)
                else:
                    logger.warning(f"Permission denied for {request.user} in {org.name}: Insufficient role {member.role}. Required: {allowed_roles}")
                    return HttpResponseForbidden("Permission denied. Insufficient role.")
            except OrganizationMember.DoesNotExist:
                logger.warning(f"Permission denied for {request.user}: Not a member of organization {org.name}")
                return HttpResponseForbidden("Permission denied. Not a member of this organization.")

        return wrapper
    return decorator
