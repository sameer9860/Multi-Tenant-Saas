from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.models import Organization
from apps.billing.models import Subscription
from apps.billing.models import Usage

@receiver(post_save, sender=Organization)
def create_subscription(sender, instance, created, **kwargs):
    if created:
        Subscription.objects.create(
            organization=instance,
            plan='FREE'
        )
        
@receiver(post_save, sender=Organization)
def create_usage(sender, instance, created, **kwargs):
    if created:
        Usage.objects.create(
            organization=instance
        )