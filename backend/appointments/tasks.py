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
    This task should be called periodically or reschedule itself.
    """
    now = timezone.now()
    
    # 1. Look for appointments in the next 24-25 hours (24h reminder)
    on_day_start = now + timedelta(hours=23, minutes=45)
    on_day_end = now + timedelta(hours=24, minutes=15)
    
    # 2. Look for appointments in the next 2-3 hours (2h reminder)
    two_hour_start = now + timedelta(hours=1, minutes=45)
    two_hour_end = now + timedelta(hours=2, minutes=15)

    reminders_to_process = [
        ('24_HOURS', on_day_start, on_day_end),
        ('2_HOURS', two_hour_start, two_hour_end),
    ]

    for reminder_type, start, end in reminders_to_process:
        # Find appointments that fall in this window
        appointments = Appointment.objects.filter(
            status='SCHEDULED',
            date__range=[start.date(), end.date()],
        )
        
        for appt in appointments:
            # Combine appt date and time for precise check
            appt_datetime = timezone.make_aware(
                timezone.datetime.combine(appt.date, appt.time),
                timezone.get_current_timezone()
            )
            
            if start <= appt_datetime <= end:
                # Check if reminder already exists/sent
                reminder, created = AppointmentReminder.objects.get_or_create(
                    appointment=appt,
                    reminder_type=reminder_type,
                    defaults={'scheduled_for': appt_datetime, 'status': 'PENDING'}
                )
                
                if created or reminder.status == 'PENDING':
                    try:
                        send_single_reminder(reminder)
                    except Exception as e:
                        logger.error(f"Failed to send reminder {reminder.id}: {str(e)}")
                        reminder.status = 'FAILED'
                        reminder.error_message = str(e)
                        reminder.save()

def send_single_reminder(reminder):
    appt = reminder.appointment
    customer = appt.customer
    
    if not customer.email:
        reminder.status = 'FAILED'
        reminder.error_message = "Customer has no email address."
        reminder.save()
        return

    subject = f"Reminder: Your appointment for {appt.service.name}"
    message = f"Hello {customer.name},\n\nThis is a reminder for your appointment:\n"
    message += f"Service: {appt.service.name}\n"
    message += f"Staff: {appt.staff.name}\n"
    message += f"Date: {appt.date}\n"
    message += f"Time: {appt.time}\n\n"
    message += "See you soon!"

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [customer.email],
        fail_silently=False,
    )
    
    reminder.status = 'SENT'
    reminder.sent_at = timezone.now()
    reminder.save()
    logger.info(f"Sent {reminder.reminder_type} reminder for appointment {appt.id} to {customer.email}")
