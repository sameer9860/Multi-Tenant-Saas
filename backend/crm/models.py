from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import Organization
from django.utils import timezone

User = get_user_model()

class Tag(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="tags"
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=20, default="#3b82f6") # Default blue

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('organization', 'name')


class Lead(models.Model):

    STATUS_CHOICES = [
        ("NEW", "New"),
        ("INTERESTED", "Interested"),
        ("CONTACTED", "Contacted"),
        ("CONVERTED", "Converted"),
        ("LOST", "Lost"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="leads"
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    source = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="NEW"
    )

    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    tags = models.ManyToManyField(Tag, blank=True, related_name="leads")

    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.name



class Client(models.Model):

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="clients"
    )

    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    company = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class LeadActivity(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="lead_activities"
    )

    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="activities"
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    action = models.CharField(max_length=100)

    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.lead.name} - {self.action}"

class Expense(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="expenses"
    )
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.amount}"

class Note(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="all_notes"
    )
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="crm_notes", null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="crm_notes", null=True, blank=True)
    customer = models.ForeignKey("invoices.Customer", on_delete=models.CASCADE, related_name="crm_notes", null=True, blank=True)
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Interaction(models.Model):
    TYPE_CHOICES = [
        ("CALL", "Call"),
        ("EMAIL", "Email"),
        ("MEETING", "Meeting"),
        ("NOTE", "Other"),
    ]
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="all_interactions"
    )
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="crm_interactions", null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="crm_interactions", null=True, blank=True)
    customer = models.ForeignKey("invoices.Customer", on_delete=models.CASCADE, related_name="crm_interactions", null=True, blank=True)
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    summary = models.TextField()
    date = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

class Reminder(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="all_reminders"
    )
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name="crm_reminders", null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name="crm_reminders", null=True, blank=True)
    customer = models.ForeignKey("invoices.Customer", on_delete=models.CASCADE, related_name="crm_reminders", null=True, blank=True)
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    remind_at = models.DateTimeField()
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
