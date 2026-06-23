from django.core.management.base import BaseCommand
from apps.billing.models import Usage


class Command(BaseCommand):
    help = "Reset monthly API usage counters for all organizations"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be reset without actually resetting',
        )

    def handle(self, *args, **kwargs):
        dry_run = kwargs.get('dry_run', False)
        usages = Usage.objects.select_related('organization').all()
        count = 0

        for usage in usages:
            if dry_run:
                self.stdout.write(
                    f"[DRY RUN] Would reset api_calls_used for: {usage.organization.name}"
                )
            else:
                usage.api_calls_used = 0
                usage.save(update_fields=['api_calls_used'])
                count += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run complete. {usages.count()} organizations would be reset."))
        else:
            self.stdout.write(self.style.SUCCESS(f"✅ Usage reset complete. {count} organizations reset."))
