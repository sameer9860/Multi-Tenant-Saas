import logging
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer, OrganizationMemberSerializer
from .models import User, OrganizationMember
from apps.accounts.decorators import require_role

logger = logging.getLogger(__name__)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
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
            
            logger.info(f"User {user.email} switched organization to {membership.organization.name} ({org_id})")
            return Response({"detail": f"Switched to {membership.organization.name}"})
        except OrganizationMember.DoesNotExist:
            logger.warning(f"User {request.user.email} attempted to switch to organization {org_id} without membership.")
            return Response({"detail": "Not a member of this organization"}, status=403)

class OrganizationMemberViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None)
        if not org:
            return OrganizationMember.objects.none()
        return OrganizationMember.objects.filter(organization=org).select_related('user')

    def perform_create(self, serializer):
        org = self.request.organization
        usage = getattr(org, 'usage', None)
        
        # 1. Enforce Role (Only Admin/Owner can add members)
        user_role = getattr(self.request, 'user_role', 'STAFF')
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied("Only Owners or Admins can add team members.")

        # 2. Check Plan Limits
        if usage:
            can_add, msg = usage.can_add_team_member()
            if not can_add:
                raise PermissionDenied(msg)

        # 3. Handle User lookup/creation by email
        email = self.request.data.get('email')
        role = self.request.data.get('role', 'STAFF')
        
        if not email:
            raise PermissionDenied("Email is required for invitation.")

        # Find or Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': email.split('@')[0].capitalize(),
                'organization': org,
                'role': role
            }
        )
        
        # Link to Membership
        serializer.save(user=user, organization=org, role=role)

        # 4. Increment usage count
        if usage:
            usage.increment_team_member_count()

    def destroy(self, request, *args, **kwargs):
        user_role = getattr(request, 'user_role', 'STAFF')
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied("Only Owners or Admins can remove team members.")
        
        instance = self.get_object()
        if instance.role == 'OWNER' and user_role != 'OWNER':
            raise PermissionDenied("Only the Owner can remove other Owners.")
            
        return super().destroy(request, *args, **kwargs)
