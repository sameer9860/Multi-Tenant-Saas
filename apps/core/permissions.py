from rest_framework.permissions import BasePermission

class IsOwnerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['OWNER', 'ADMIN']
