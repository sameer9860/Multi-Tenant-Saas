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