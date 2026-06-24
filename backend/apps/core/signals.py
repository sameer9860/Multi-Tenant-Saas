from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.core.models import Organization


@receiver(post_save, sender=Organization)
def create_org_defaults(sender, instance, created, **kwargs):
    """
    Create Subscription and Usage records when a new Organization is created.
    Uses get_or_create to be safe against duplicate signals and data migrations.
    Merged from two separate receivers to avoid double signal firing.
    """
    if not created:
        return

    from apps.billing.models import Subscription, Usage

    Subscription.objects.get_or_create(
        organization=instance,
        defaults={'plan': 'FREE'}
    )
    Usage.objects.get_or_create(organization=instance)
