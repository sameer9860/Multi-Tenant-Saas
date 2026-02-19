from django.http import HttpResponseForbidden
from functools import wraps
from .models import OrganizationMember

def require_role(allowed_roles):
    """
    Decorator to restrict view access based on OrganizationMember role.
    Example usage: @require_role(["OWNER", "ADMIN"])
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Try to get membership for current organization
            org = getattr(request, 'organization', None)
            if not org:
                return HttpResponseForbidden("Organization context missing.")
            
            try:
                member = OrganizationMember.objects.get(
                    user=request.user,
                    organization=org
                )
                if member.role not in allowed_roles:
                    return HttpResponseForbidden("Permission denied. Insufficient role.")
            except OrganizationMember.DoesNotExist:
                return HttpResponseForbidden("Permission denied. Not a member of this organization.")

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
