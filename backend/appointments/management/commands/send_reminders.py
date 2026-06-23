from django.core.management.base import BaseCommand
from appointments.tasks import send_appointment_reminders

class Command(BaseCommand):
    help = 'Manually trigger the background task to send appointment reminders'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Triggering appointment reminders check...'))
        # Call the actual function logic (without going to background queue)
        send_appointment_reminders.now()
        self.stdout.write(self.style.SUCCESS('Reminder check completed.'))
