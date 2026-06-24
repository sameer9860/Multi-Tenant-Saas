from rest_framework.permissions import BasePermission, SAFE_METHODS
from .roles import get_user_role_name, has_any_role  # fix: has_any_role was missing


class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(request, ["OWNER", "ADMIN"])


class IsOwnerAdminOrAccountant(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(request, ["OWNER", "ADMIN", "ACCOUNTANT"])


class IsOwnerOrAdminOrReadOnly(BasePermission):
    """Authenticated users can read; only OWNER/ADMIN can write."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return has_any_role(request, ["OWNER", "ADMIN"])


class IsLeaveRequestApprover(BasePermission):
    """Leave requests: members can read/create; only OWNER/ADMIN can approve/reject."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS or request.method == "POST":
            return True
        return has_any_role(request, ["OWNER", "ADMIN"])


class IsPayrollManager(BasePermission):
    """Salary/payroll data: OWNER/ADMIN/ACCOUNTANT only.

    Blocks STAFF from reading salary, payroll, and advance data.
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return has_any_role(request, ["OWNER", "ADMIN", "ACCOUNTANT"])
