from django.db import models

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
