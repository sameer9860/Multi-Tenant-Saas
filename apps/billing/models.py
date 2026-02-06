from django.db import models
from apps.core.models import Organization

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

    def __str__(self):
        return f"{self.organization.name} - {self.plan}"


class Usage(models.Model):
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='usage'
    )
    invoices_created = models.PositiveIntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    PAYMENT_PROVIDERS = (
        ("ESEWA", "eSewa"),
        ("KHALTI", "Khalti"),
    )

    STATUS_CHOICES = (
        ("PENDING", "Pending"),
        ("SUCCESS", "Success"),
        ("FAILED", "Failed"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    plan = models.CharField(max_length=20)
    provider = models.CharField(max_length=10, choices=PAYMENT_PROVIDERS)
    amount = models.PositiveIntegerField()
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default="PENDING"
    )
    reference_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    