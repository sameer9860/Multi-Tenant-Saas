import logging
from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .serializers import UserSerializer, OrganizationMemberSerializer
from .models import User, OrganizationMember, Role
from apps.core.roles import get_user_role_name
from apps.core.permissions import IsOwnerOrAdmin

logger = logging.getLogger(__name__)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        memberships = OrganizationMember.objects.filter(
            user=user
        ).select_related('organization', 'role')

        current_role = getattr(request, 'user_role', None)
        current_role = current_role.name if hasattr(current_role, 'name') else str(current_role or '')

        orgs = []
        for m in memberships:
            is_primary = user.organization_id == m.organization_id
            role_name = m.role.name if m.role else ''
            if is_primary:
                current_role = role_name
            orgs.append({
                "id": m.organization.id,
                "name": m.organization.name,
                "role": role_name,
                "is_primary": is_primary,
            })

        return Response({
            "email": user.email,
            "full_name": user.full_name,
            "role": current_role,
            "organization": {
                "id": user.organization.id,
                "name": user.organization.name,
                "plan": user.organization.plan,
            },
            "memberships": orgs,
        })


class SwitchOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org_id = request.data.get('organization_id')
        if not org_id:
            return Response({"error": "organization_id required"}, status=400)

        try:
            membership = OrganizationMember.objects.select_related(
                'organization', 'role'
            ).get(user=request.user, organization_id=org_id)

            user = request.user
            user.organization = membership.organization
            user.role = membership.role
            user.save(update_fields=['organization', 'role'])

            logger.info(
                "User %s switched to organization %s (%s)",
                user.email, membership.organization.name, org_id
            )
            return Response({"detail": f"Switched to {membership.organization.name}"})

        except OrganizationMember.DoesNotExist:
            logger.warning(
                "User %s attempted to switch to org %s without membership.",
                request.user.email, org_id
            )
            return Response({"error": "Not a member of this organization"}, status=403)


class OrganizationMemberViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('create', 'destroy'):
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    def get_queryset(self):
        org = getattr(self.request, 'organization', None)
        if not org:
            return OrganizationMember.objects.none()
        return OrganizationMember.objects.filter(
            organization=org
        ).select_related('user', 'role', 'user__role')

    def perform_create(self, serializer):
        org = getattr(self.request, 'organization', None)
        if not org:
            raise PermissionDenied("Organization context missing.")

        usage = getattr(org, 'usage', None)
        user_role = get_user_role_name(self.request)

        logger.info(
            "Team member creation attempt: user=%s role=%s",
            self.request.user.email, user_role
        )

        if usage:
            can_add, msg = usage.can_add_team_member()
            if not can_add:
                raise PermissionDenied(msg)

        # Validate inputs
        email = (self.request.data.get('email') or '').strip()
        full_name = (self.request.data.get('full_name') or '').strip()
        phone = (self.request.data.get('phone') or '').strip() or None
        password = self.request.data.get('password') or None
        role_name = (self.request.data.get('role') or 'STAFF').strip().upper()

        if not email:
            raise drf_serializers.ValidationError({"email": "Email is required."})

        # Enforce role assignment rules
        assignable_roles = {
            'OWNER': {'OWNER', 'ADMIN', 'ACCOUNTANT', 'STAFF'},
            'ADMIN': {'ADMIN', 'ACCOUNTANT', 'STAFF'},
        }
        allowed = assignable_roles.get(user_role, set())
        if role_name not in allowed:
            raise PermissionDenied(
                f"You cannot assign the {role_name} role. "
                f"Allowed: {', '.join(sorted(allowed)) or 'none'}"
            )

        if not full_name:
            full_name = email.split('@')[0].capitalize()

        role_obj, _ = Role.objects.get_or_create(name=role_name, organization=org)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'organization': org,
                'role': role_obj,
                'phone': phone,
            }
        )

        if created and password:
            user.set_password(password)
            user.save(update_fields=['password'])
        elif not created and phone and user.phone != phone:
            user.phone = phone
            user.save(update_fields=['phone'])

        membership, _ = OrganizationMember.objects.update_or_create(
            user=user,
            organization=org,
            defaults={'role': role_obj}
        )

        serializer.instance = membership

        if usage:
            usage.increment_team_member_count()

    def destroy(self, request, *args, **kwargs):
        user_role = get_user_role_name(request)
        instance = self.get_object()

        if instance.user == request.user:
            raise PermissionDenied("You cannot remove your own membership.")

        instance_role_name = (
            instance.role.name if instance.role else 'STAFF'
        ).upper()

        if user_role == 'OWNER':
            return super().destroy(request, *args, **kwargs)

        if user_role == 'ADMIN':
            if instance_role_name in ('STAFF', 'ACCOUNTANT'):
                return super().destroy(request, *args, **kwargs)
            raise PermissionDenied(
                f"Admins cannot remove {instance_role_name} members. Only Owners can."
            )

        raise PermissionDenied("You do not have permission to remove members.")
