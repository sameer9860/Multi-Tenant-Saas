"""
Management command to initialize plan limits for all plans
Run: python manage.py init_plan_limits
"""
from django.core.management.base import BaseCommand
from apps.billing.models import PlanLimit

class Command(BaseCommand):
    help = 'Initialize plan limits for all subscription plans'

    def handle(self, *args, **options):
        # Define plans and their limits
        plans_config = {
            'FREE': {
                'invoices': 10,
                'customers': 5,
                'team_members': 1,
                'api_calls': 100,
                'reports': 0,  # Not allowed
            },
            'BASIC': {
                'invoices': 1000,
                'customers': 50,
                'team_members': 3,
                'api_calls': 10000,
                'reports': 1,  # Basic reports
            },
            'PRO': {
                'invoices': 3000,
                'customers': -1,  # Unlimited
                'team_members': -1,  # Unlimited
                'api_calls': -1,  # Unlimited
                'reports': -1,  # Unlimited
            },
        }

        created_count = 0
        for plan, features in plans_config.items():
            for feature, limit in features.items():
                limit_obj, created = PlanLimit.objects.get_or_create(
                    plan=plan,
                    feature=feature,
                    defaults={'limit_value': limit}
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Created: {plan} - {feature}: {limit if limit != -1 else "Unlimited"}'
                        )
                    )
                    created_count += 1
                else:
                    # Update if exists but limit is different
                    if limit_obj.limit_value != limit:
                        limit_obj.limit_value = limit
                        limit_obj.save()
                        self.stdout.write(
                            self.style.WARNING(
                                f'⟳ Updated: {plan} - {feature}: {limit if limit != -1 else "Unlimited"}'
                            )
                        )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Successfully initialized {created_count} new plan limits'
            )
        )
