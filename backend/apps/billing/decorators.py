"""
DEPRECATED — these decorators are not wired to any view.
Use apps.core.permissions.IsPayrollManager or the Usage model methods directly.
Kept to avoid import errors during transition; will be removed in a future cleanup.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def check_invoice_limit(view_func):
    """Deprecated. Use Usage.can_create_invoice() inside the view instead."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_create, message = usage.can_create_invoice()
            if not can_create:
                return Response(
                    {"error": message, "current": usage.invoices_created,
                     "limit": usage.get_plan_limit('invoices'), "plan": usage.get_plan()},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response({"error": f"Could not verify usage: {str(e)}"}, status=500)
        return view_func(request, *args, **kwargs)
    return wrapper


def check_customer_limit(view_func):
    """Deprecated. Use Usage.can_add_customer() inside the view instead."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_add, message = usage.can_add_customer()
            if not can_add:
                return Response(
                    {"error": message, "current": usage.customers_created,
                     "limit": usage.get_plan_limit('customers'), "plan": usage.get_plan()},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response({"error": f"Could not verify usage: {str(e)}"}, status=500)
        return view_func(request, *args, **kwargs)
    return wrapper


def check_team_member_limit(view_func):
    """Deprecated. Use Usage.can_add_team_member() inside the view instead."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_add, message = usage.can_add_team_member()
            if not can_add:
                return Response(
                    {"error": message, "current": usage.team_members_added,
                     "limit": usage.get_plan_limit('team_members'), "plan": usage.get_plan()},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response({"error": f"Could not verify usage: {str(e)}"}, status=500)
        return view_func(request, *args, **kwargs)
    return wrapper


def require_feature(feature_name):
    """Deprecated. Use Usage.get_plan_limit() inside the view instead."""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            try:
                usage = request.organization.usage
                limit = usage.get_plan_limit(feature_name)
                if limit == 0:
                    return Response(
                        {"error": f"'{feature_name}' is not available on your plan.",
                         "feature": feature_name, "plan": usage.get_plan(), "upgrade_required": True},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Exception as e:
                return Response({"error": f"Could not verify feature access: {str(e)}"}, status=500)
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
