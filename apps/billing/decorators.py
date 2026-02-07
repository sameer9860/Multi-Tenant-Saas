"""
Decorators for plan limit enforcement
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status


def check_invoice_limit(view_func):
    """Decorator to check if organization can create invoices"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_create, message = usage.can_create_invoice()
            
            if not can_create:
                return Response(
                    {
                        "error": message,
                        "current": usage.invoices_created,
                        "limit": usage.get_plan_limit('invoices'),
                        "plan": usage.get_plan()
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response(
                {"error": f"Could not verify usage: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def check_customer_limit(view_func):
    """Decorator to check if organization can add customers"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_add, message = usage.can_add_customer()
            
            if not can_add:
                return Response(
                    {
                        "error": message,
                        "current": usage.customers_created,
                        "limit": usage.get_plan_limit('customers'),
                        "plan": usage.get_plan()
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response(
                {"error": f"Could not verify usage: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


def check_team_member_limit(view_func):
    """Decorator to check if organization can add team members"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        try:
            usage = request.organization.usage
            can_add, message = usage.can_add_team_member()
            
            if not can_add:
                return Response(
                    {
                        "error": message,
                        "current": usage.team_members_added,
                        "limit": usage.get_plan_limit('team_members'),
                        "plan": usage.get_plan()
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
        except Exception as e:
            return Response(
                {"error": f"Could not verify usage: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return view_func(request, *args, **kwargs)
    
    return wrapper
