import logging
from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .serializers import UserSerializer, OrganizationMemberSerializer
from .models import User, OrganizationMember, Role
from apps.accounts.decorators import require_role

logger = logging.getLogger(__name__)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        memberships = OrganizationMember.objects.filter(user=user)
        
        orgs = []
        # Get role name safely
        current_role_obj = user.role
        current_role = current_role_obj.name if hasattr(current_role_obj, 'name') else str(current_role_obj)
        
        for m in memberships:
            is_primary = user.organization_id == m.organization.id
            role_name = m.role.name if hasattr(m.role, 'name') else str(m.role)
            
            if is_primary:
                current_role = role_name
            
            orgs.append({
                "id": m.organization.id,
                "name": m.organization.name,
                "role": role_name,
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
            user.role = membership.role # Sync role object
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
        user_role_obj = getattr(self.request, 'user_role', None) or getattr(self.request.user, 'role', None)
        user_role = user_role_obj.name if hasattr(user_role_obj, 'name') else str(user_role_obj)
        
        logger.info(f"Team Creation Attempt: User={self.request.user.email}, request.user_role={user_role}")
        
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied(f"Only Owners or Admins can add team members. Your role is: {user_role}")

        # 2. Check Plan Limits
        if usage:
            can_add, msg = usage.can_add_team_member()
            if not can_add:
                raise PermissionDenied(msg)

        # 3. Handle User lookup/creation by email
        email = self.request.data.get('email')
        full_name = self.request.data.get('full_name')
        phone = self.request.data.get('phone')
        password = self.request.data.get('password')
        role_name = (self.request.data.get('role') or 'STAFF').upper()
        
        if not email:
            raise drf_serializers.ValidationError({"email": "Email is required for invitation."})

        if not full_name:
            full_name = email.split('@')[0].capitalize()

        # Find the Role object for the organization
        role_obj, _ = Role.objects.get_or_create(
            name=role_name,
            organization=org
        )

        # Find or Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'organization': org,
                'role': role_obj,
                'phone': phone
            }
        )
        
        if created and password:
            user.set_password(password)
            user.save()
        elif not created:
            # Update phone if user already exists
            if phone:
                user.phone = phone
                user.save()

        # Link to Membership (Check if already exists)
        membership, m_created = OrganizationMember.objects.update_or_create(
            user=user,
            organization=org,
            defaults={'role': role_obj}
        )
        
        serializer.instance = membership

        # 4. Increment usage count
        if usage:
            usage.increment_team_member_count()

    def destroy(self, request, *args, **kwargs):
        user_role_obj = getattr(request, 'user_role', None) or getattr(request.user, 'role', None)
        user_role = (user_role_obj.name if hasattr(user_role_obj, 'name') else str(user_role_obj)).upper()
        
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied("Only Owners or Admins can remove team members.")
        
        instance = self.get_object()
        
        # Prevent self-deletion
        if instance.user == request.user:
            raise PermissionDenied("You cannot remove your own membership.")
        instance_role_name = (instance.role.name if instance.role else "STAFF").upper()
        
        # OWNER can delete anyone
        if user_role == 'OWNER':
            return super().destroy(request, *args, **kwargs)
            
        # ADMIN can only delete STAFF and ACCOUNTANT
        if user_role == 'ADMIN':
            if instance_role_name in ['STAFF', 'ACCOUNTANT']:
                return super().destroy(request, *args, **kwargs)
            else:
                raise PermissionDenied(f"Admins cannot remove {instance_role_name} members. Only Owners can do this.")
            
        return super().destroy(request, *args, **kwargs)
