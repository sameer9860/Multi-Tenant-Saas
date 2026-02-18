from django.db import models
from django.utils import timezone
from apps.core.models import Organization
from datetime import timedelta, datetime

class Subscription(models.Model):
    organization = models.OneToOneField(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name='subscription'
    )

    plan = models.CharField(
        max_length=20,
        choices=[
            ('FREE', 'Free'),
            ('BASIC', 'Basic'),
            ('PRO', 'Pro'),
        ],
        default='FREE'
    )

    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    # Trial system
    is_trial = models.BooleanField(default=True)
    trial_end = models.DateTimeField(null=True, blank=True)

    def check_expiry(self):
        """Auto-downgrade expired paid plans and expired trials to FREE."""
        now = timezone.now()
        changed = False

        # Check paid plan expiry
        if self.end_date and self.end_date < now and self.plan != 'FREE':
            self.plan = 'FREE'
            self.is_active = False
            # Sync org-level plan
            try:
                self.organization.plan = 'FREE'
                self.organization.save(update_fields=['plan'])
            except Exception:
                pass
            changed = True

        # Check trial expiry
        if self.is_trial and self.trial_end and self.trial_end < now:
            self.is_trial = False
            if self.plan != 'FREE':
                self.plan = 'FREE'
                self.is_active = False
                try:
                    self.organization.plan = 'FREE'
                    self.organization.save(update_fields=['plan'])
                except Exception:
                    pass
            changed = True

        if changed:
            self.save(update_fields=['plan', 'is_active', 'is_trial'])

    def save(self, *args, **kwargs):
        # Auto-set 7-day trial for new FREE subscriptions
        if not self.pk and self.is_trial and not self.trial_end:
            self.trial_end = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.organization.name} - {self.plan}"


class PlanLimit(models.Model):
    """Define feature limits for each plan"""
    FEATURE_CHOICES = [
        ('invoices', 'Invoices'),
        ('customers', 'Customers'),
        ('team_members', 'Team Members'),
        ('api_calls', 'API Calls/month'),
        ('reports', 'Advanced Reports'),
    ]
    
    plan = models.CharField(
        max_length=20,
        choices=[
            ('FREE', 'Free'),
            ('BASIC', 'Basic'),
            ('PRO', 'Pro'),
        ]
    )
    feature = models.CharField(max_length=50, choices=FEATURE_CHOICES)
    limit_value = models.IntegerField()  # -1 = unlimited
    
    class Meta:
        unique_together = ('plan', 'feature')
        verbose_name_plural = "Plan Limits"
    
    def __str__(self):
        limit = "Unlimited" if self.limit_value == -1 else self.limit_value
        return f"{self.plan} - {self.feature}: {limit}"


class Usage(models.Model):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='usage'
    )
    invoices_created = models.PositiveIntegerField(default=0)
    customers_created = models.PositiveIntegerField(default=0)
    team_members_added = models.PositiveIntegerField(default=0)
    api_calls_used = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_plan(self):
        """Get current plan for this organization"""
        try:
            return self.organization.subscription.plan
        except:
            return 'FREE'
    
    def get_plan_limit(self, feature):
        """Get limit for a specific feature, with fallback to constants"""
        try:
            limit = PlanLimit.objects.get(
                plan=self.get_plan(),
                feature=feature
            )
            return limit.limit_value
        except PlanLimit.DoesNotExist:
            # Fallback to constants if not in DB
            from .constants import PLAN_LIMITS
            plan = self.get_plan()
            limit = PLAN_LIMITS.get(plan, {}).get(feature, -1)
            # Normalize None/unlimited to -1 for consistency with other methods
            return -1 if limit is None else limit
    
    def can_create_invoice(self):
        """Check if organization can create more invoices"""
        limit = self.get_plan_limit('invoices')
        if limit == -1:  # unlimited
            return True, None
        if self.invoices_created >= limit:
            return False, f"Reached invoice limit ({limit}). Upgrade your plan."
        return True, None
    
    def can_add_customer(self):
        """Check if organization can add more customers"""
        limit = self.get_plan_limit('customers')
        if limit == -1:  # unlimited
            return True, None
        if self.customers_created >= limit:
            return False, f"Reached customer limit ({limit}). Upgrade your plan."
        return True, None
    
    def can_add_team_member(self):
        """Check if organization can add more team members"""
        limit = self.get_plan_limit('team_members')
        if limit == -1:  # unlimited
            return True, None
        if self.team_members_added >= limit:
            return False, f"Reached team member limit ({limit}). Upgrade your plan."
        return True, None
    
    def increment_invoice_count(self):
        """Increment invoice count"""
        can_add, msg = self.can_create_invoice()
        if can_add:
            self.invoices_created += 1
            self.save()
            return True
        return False
    
    def increment_customer_count(self):
        """Increment customer count"""
        can_add, msg = self.can_add_customer()
        if can_add:
            self.customers_created += 1
            self.save()
            return True
        return False
    
    def reset_monthly_limits(self):
        """Reset monthly limits (call this on subscription renewal)"""
        self.api_calls_used = 0
        self.save()

class Payment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    amount = models.PositiveIntegerField()
    plan = models.CharField(max_length=20)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.organization.name} - {self.plan} - {self.status}"
    
class PaymentTransaction(models.Model):
    """Complete audit trail for every payment"""
    
    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    )
    
    PROVIDER_CHOICES = (
        ("ESEWA", "eSewa"),
        ("KHALTI", "Khalti"),
    )
    
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE, 
        related_name="payment_transactions"
    )
    plan = models.CharField(max_length=20)  # PRO, BUSINESS, etc
    amount = models.PositiveIntegerField()  # in NPR
    provider = models.CharField(
        max_length=20, 
        choices=PROVIDER_CHOICES, 
        default="ESEWA"
    )
    transaction_id = models.CharField(
        max_length=255, 
        unique=True,
        db_index=True
    )
    reference_id = models.CharField(
        max_length=255, 
        blank=True, 
        null=True
    )
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default="PENDING",
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['transaction_id', 'status']),
        ]
    
    def __str__(self):
        return f"{self.organization.name} - {self.plan} - {self.status}"
    
    def activate_plan(self):
        """Upgrade organization plan after successful payment"""
        from apps.billing.models import Subscription
        # Ensure subscription exists
        subscription, _ = Subscription.objects.get_or_create(
            organization=self.organization
        )

        # Update subscription fields atomically
        subscription.plan = self.plan
        subscription.is_active = True
        subscription.start_date = timezone.now()
        # Set a default 30-day period for the subscription
        subscription.end_date = subscription.start_date + timedelta(days=30)
        subscription.save()

        # Also update organization-level plan for easy access elsewhere
        try:
            org = self.organization
            org.plan = self.plan
            org.save()
        except Exception:
            pass

        # Reset monthly usage counters where appropriate
        try:
            usage = getattr(self.organization, 'usage', None)
            if usage:
                usage.reset_monthly_limits()
        except Exception:
            pass

        return subscription
