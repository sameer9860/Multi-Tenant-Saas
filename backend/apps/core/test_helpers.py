"""
Shared test utilities for all apps.
Import BaseAPITestCase instead of APITestCase to get org/user/JWT setup for free.
"""
from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.core.models import Organization
from apps.accounts.models import User, Role, OrganizationMember


def make_org(name="Test Org", slug=None):
    slug = slug or name.lower().replace(" ", "-")
    return Organization.objects.create(
        name=name, slug=slug,
        email=f"{slug}@example.com", phone="9800000000"
    )


def make_user(org, email="owner@example.com", role_name="OWNER", password="testpass123", full_name="Test User"):
    role, _ = Role.objects.get_or_create(name=role_name, organization=org)
    user = User.objects.create_user(
        email=email, full_name=full_name,
        organization=org, password=password, role=role
    )
    OrganizationMember.objects.get_or_create(user=user, organization=org, defaults={"role": role})
    return user


def auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


class BaseAPITestCase(APITestCase):
    """
    Base class that sets up:
      - self.org  — primary organization
      - self.owner / self.admin / self.staff — users with respective roles
      - self.owner_client / self.admin_client / self.staff_client — authenticated clients
    """

    def setUp(self):
        self.org = make_org()
        self.owner = make_user(self.org, email="owner@test.com", role_name="OWNER")
        self.admin = make_user(self.org, email="admin@test.com", role_name="ADMIN")
        self.staff = make_user(self.org, email="staff@test.com", role_name="STAFF")

        self.owner_client = auth_client(self.owner)
        self.admin_client = auth_client(self.admin)
        self.staff_client = auth_client(self.staff)

        # Second org for cross-tenant tests
        self.other_org = make_org(name="Other Org", slug="other-org")
        self.other_owner = make_user(
            self.other_org, email="other@test.com", role_name="OWNER"
        )
        self.other_client = auth_client(self.other_owner)
