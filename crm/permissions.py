from rest_framework.permissions import BasePermission

class IsAdminOrReadOnly(BasePermission):
    """
    Custom permission to only allow ADMIN users to perform write operations.
    Others can only see the data (GET).
    """

    def has_permission(self, request, view):
        # Read-only permissions are allowed for any request
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True

        # Write permissions are only allowed for ADMIN and OWNER users
        return getattr(request.user, 'role', None) in ["ADMIN", "OWNER"]
