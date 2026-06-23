from django.db import models
from apps.invoices.models import Customer

class Service(models.Model):
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name="services"
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

class Staff(models.Model):
    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name="appointment_staff"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=100, help_text="e.g., Doctor, Stylist, Tutor")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.role} ({self.organization.name})"

class StaffAvailability(models.Model):
    DAYS_OF_WEEK = (
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    )

    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        verbose_name_plural = "Staff Availabilities"
        unique_together = ('staff', 'day_of_week', 'start_time', 'end_time')

    def __str__(self):
        return f"{self.staff.name} - {self.get_day_of_week_display()} ({self.start_time} - {self.end_time})"

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('NO_SHOW', 'No-show'),
    )

    organization = models.ForeignKey(
        'core.Organization',
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    staff = models.ForeignKey(
        Staff,
        on_delete=models.CASCADE,
        related_name="appointments"
    )
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Prevent double booking for the same staff member at the same time
        unique_together = ('staff', 'date', 'time')

    def __str__(self):
        return f"{self.customer.name} - {self.service.name} with {self.staff.name} on {self.date} at {self.time}"

class AppointmentReminder(models.Model):
    REMINDER_TYPES = (
        ('24_HOURS', '24 Hours Before'),
        ('2_HOURS', '2 Hours Before'),
    )
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    )

    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    scheduled_for = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        unique_together = ('appointment', 'reminder_type')

    def __str__(self):
        return f"Reminder ({self.reminder_type}) for {self.appointment}"
