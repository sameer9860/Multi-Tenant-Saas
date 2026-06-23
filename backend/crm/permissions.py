from rest_framework.permissions import BasePermission
from apps.core.roles import get_user_role_name

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
        user_role = get_user_role_name(request)
        return user_role in ["ADMIN", "OWNER", "ACCOUNTANT"]


class IsAdminOwnerOrStaffUpdate(BasePermission):
    """
    Custom permission:
    - Admin/Owner: Full access (Create, Read, Update, Delete)
    - Staff: Read and Update only (No Create, No Delete)
    """

    def has_permission(self, request, view):
        # Allow read-only methods for everyone (authenticated)
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return True
        
        user_role = get_user_role_name(request)

        # Allow Update (PUT, PATCH) for Admin, Owner, STAFF, and ACCOUNTANT
        if request.method in ["PUT", "PATCH"]:
            return user_role in ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"]
        
        # Allow Create (POST) and Delete (DELETE) only for Admin/Owner
        if request.method in ["POST", "DELETE"]:
            return user_role in ["ADMIN", "OWNER"]
            
        return False
