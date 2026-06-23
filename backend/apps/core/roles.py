from __future__ import annotations

from typing import Iterable, Optional


def get_user_role_name(request, default: Optional[str] = None) -> Optional[str]:
    """
    Normalize the current user's role for the active organization.

    We support both:
    - `request.user_role` populated by `TenantMiddleware` (may be a Role model or string)
    - `request.user.role` fallback (may be a Role model or string)
    """
    role_obj = getattr(request, "user_role", None) or getattr(getattr(request, "user", None), "role", None)
    if role_obj is None:
        return default

    name = role_obj.name if hasattr(role_obj, "name") else str(role_obj)
    name = str(name).upper()
    return name or default


def has_any_role(request, allowed_roles: Iterable[str]) -> bool:
    role = get_user_role_name(request)
    if not role:
        return False
    allowed = {str(r).upper() for r in allowed_roles}
    return role in allowed

