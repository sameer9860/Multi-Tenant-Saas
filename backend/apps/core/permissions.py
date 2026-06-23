from rest_framework.permissions import BasePermission, SAFE_METHODS
from .roles import get_user_role_name


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
