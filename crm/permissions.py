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
        # Use user_role from middleware if available
        user_role_obj = getattr(request, 'user_role', None) or getattr(request.user, 'role', None)
        user_role = user_role_obj.name if hasattr(user_role_obj, 'name') else user_role_obj
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
        
        # Use user_role from middleware if available
        user_role_obj = getattr(request, 'user_role', None) or getattr(request.user, 'role', None)
        user_role = user_role_obj.name if hasattr(user_role_obj, 'name') else user_role_obj

        # Allow Update (PUT, PATCH) for Admin, Owner, STAFF, and ACCOUNTANT
        if request.method in ["PUT", "PATCH"]:
            return user_role in ["ADMIN", "OWNER", "STAFF", "ACCOUNTANT"]
        
        # Allow Create (POST) and Delete (DELETE) only for Admin/Owner
        if request.method in ["POST", "DELETE"]:
            return user_role in ["ADMIN", "OWNER"]
            
        return False
