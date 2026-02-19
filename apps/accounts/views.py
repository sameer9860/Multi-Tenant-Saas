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
        role = self.request.data.get('role', 'STAFF')
        
        if not email:
            raise PermissionDenied("Email is required for invitation.")

        if not full_name:
            full_name = email.split('@')[0].capitalize()

        # Find or Create User
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'organization': org,
                'role': role,
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
            defaults={'role': role}
        )
        
        # We don't call serializer.save() here as we manually handled the creation
        # But we still want to return the data. DRF expects serializer.save() or something similar info.
        # Actually, if we don't call save(), we should set the instance on the serializer.
        serializer.instance = membership

        # 4. Increment usage count
        if usage:
            usage.increment_team_member_count()

    def destroy(self, request, *args, **kwargs):
        user_role = getattr(request, 'user_role', 'STAFF')
        if user_role not in ['OWNER', 'ADMIN']:
            raise PermissionDenied("Only Owners or Admins can remove team members.")
        
        instance = self.get_object()
        # Only STAFF can be deleted as per user request
        if instance.role != 'STAFF':
            raise PermissionDenied(f"Cannot remove a member with role {instance.role}. Only members with the role 'STAFF' can be deleted.")
            
        return super().destroy(request, *args, **kwargs)
