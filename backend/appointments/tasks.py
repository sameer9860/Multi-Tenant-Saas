import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from background_task import background
from .models import Appointment, AppointmentReminder

logger = logging.getLogger(__name__)


@background(schedule=60)
def send_appointment_reminders():
    """
    Background task to check for upcoming appointments and send reminders.
    Runs every 60 seconds via the background task worker.

    Fixes:
    - Uses timezone-aware datetime comparison (not date range)
    - Scoped to SCHEDULED appointments only
    - Org isolation: each appointment already belongs to an org via FK
    """
    now = timezone.now()

    reminders_to_process = [
        ('24_HOURS', now + timedelta(hours=23, minutes=45), now + timedelta(hours=24, minutes=15)),
        ('2_HOURS',  now + timedelta(hours=1,  minutes=45), now + timedelta(hours=2,  minutes=15)),
    ]

    for reminder_type, window_start, window_end in reminders_to_process:
        # Filter by date range first (DB-level), then refine with exact datetime
        appointments = Appointment.objects.filter(
            status='SCHEDULED',
            date__gte=window_start.date(),
            date__lte=window_end.date(),
        ).select_related('customer', 'service', 'staff', 'organization')

        for appt in appointments:
            # Build a timezone-aware datetime for the appointment
            try:
                appt_datetime = timezone.make_aware(
                    timezone.datetime.combine(appt.date, appt.time),
                    timezone.get_current_timezone()
                )
            except Exception as e:
                logger.warning("Could not build datetime for appointment %s: %s", appt.id, e)
                continue

            # Precise window check
            if not (window_start <= appt_datetime <= window_end):
                continue

            reminder, created = AppointmentReminder.objects.get_or_create(
                appointment=appt,
                reminder_type=reminder_type,
                defaults={'scheduled_for': appt_datetime, 'status': 'PENDING'}
            )

            if reminder.status not in ('PENDING',):
                continue  # already sent or failed — skip

            try:
                _send_single_reminder(reminder)
            except Exception as e:
                logger.error("Failed to send reminder %s: %s", reminder.id, e)
                reminder.status = 'FAILED'
                reminder.error_message = str(e)
                reminder.save(update_fields=['status', 'error_message'])


def _send_single_reminder(reminder):
    """Send email for a single AppointmentReminder and update its status."""
    appt = reminder.appointment
    customer = appt.customer

    if not customer.email:
        reminder.status = 'FAILED'
        reminder.error_message = "Customer has no email address."
        reminder.save(update_fields=['status', 'error_message'])
        return

    label = "24 hours" if reminder.reminder_type == '24_HOURS' else "2 hours"
    subject = f"Reminder: Your appointment in {label} — {appt.service.name}"
    message = (
        f"Hello {customer.name},\n\n"
        f"This is a reminder for your upcoming appointment:\n"
        f"  Service : {appt.service.name}\n"
        f"  Staff   : {appt.staff.name}\n"
        f"  Date    : {appt.date}\n"
        f"  Time    : {appt.time}\n\n"
        f"See you soon!\n"
        f"— {appt.organization.name}"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [customer.email],
        fail_silently=False,
    )

    reminder.status = 'SENT'
    reminder.sent_at = timezone.now()
    reminder.save(update_fields=['status', 'sent_at'])
    logger.info(
        "Sent %s reminder for appointment %s to %s",
        reminder.reminder_type, appt.id, customer.email
    )
