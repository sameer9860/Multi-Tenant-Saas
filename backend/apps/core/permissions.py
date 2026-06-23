from rest_framework.permissions import BasePermission
from .roles import has_any_role

class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return has_any_role(request, ["OWNER", "ADMIN"])
