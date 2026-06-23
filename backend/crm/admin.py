from django.contrib import admin
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder

# Register your models here.
admin.site.register(Lead)
admin.site.register(Client)
admin.site.register(LeadActivity)
admin.site.register(Expense)
admin.site.register(Note)
admin.site.register(Interaction)
admin.site.register(Reminder)    