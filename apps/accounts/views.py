from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        from .models import OrganizationMember
        memberships = OrganizationMember.objects.filter(user=user)
        
        orgs = []
        current_role = user.role # Fallback
        for m in memberships:
            is_primary = user.organization_id == m.organization.id
            if is_primary:
                current_role = m.role
            
            orgs.append({
                "id": m.organization.id,
                "name": m.organization.name,
                "role": m.role,
                "is_primary": is_primary
            })

        return Response({
            "email": user.email,
            "full_name": user.full_name,
            "role": current_role,
            "organization": {
                "id": user.organization.id,
                "name": user.organization.name,
                "plan": user.organization.plan
            },
            "memberships": orgs
        })

class SwitchOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org_id = request.data.get('organization_id')
        if not org_id:
            return Response({"detail": "organization_id required"}, status=400)
        
        from apps.accounts.models import OrganizationMember
        from apps.core.models import Organization
        
        try:
            membership = OrganizationMember.objects.get(
                user=request.user,
                organization_id=org_id
            )
            # Switch primary organization
            user = request.user
            user.organization = membership.organization
            user.role = membership.role # Sync role as well
            user.save()
            
            return Response({"detail": f"Switched to {membership.organization.name}"})
        except OrganizationMember.DoesNotExist:
            return Response({"detail": "Not a member of this organization"}, status=403)
