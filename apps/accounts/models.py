from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, full_name, organization, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, full_name=full_name, organization=organization, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        from django.apps import apps
        org = apps.get_model('core', 'Organization').objects.first()
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, full_name, org, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    organization = models.ForeignKey(
        'core.Organization',  # <- use string reference instead of direct import
        on_delete=models.CASCADE,
        related_name="users"
    )
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    role = models.CharField(
        max_length=20,
        choices=[('OWNER', 'Owner'), ('ADMIN', 'Admin'), ('STAFF', 'Staff')],
        default='STAFF'
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    def __str__(self):
        return self.email


class OrganizationMember(models.Model):
    ROLE_CHOICES = [
        ("OWNER", "Owner"),
        ("ADMIN", "Admin"),
        ("STAFF", "Staff"),
        ("ACCOUNTANT", "Accountant"),
    ]

    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name="memberships"
    )

    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name="members"
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="STAFF"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "organization")

    def __str__(self):
        return f"{self.user.email} - {self.organization.name}"


# SIGNALS for synchronization (Day 21)
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=User)
def sync_user_to_member(sender, instance, created, **kwargs):
    """
    Keep OrganizationMember in sync with User.organization and User.role.
    This ensures backward compatibility with existing views.
    """
    if instance.organization:
        # Update or create the membership
        OrganizationMember.objects.update_or_create(
            user=instance,
            organization=instance.organization,
            defaults={'role': instance.role if instance.role in dict(OrganizationMember.ROLE_CHOICES) else "STAFF"}
        )
