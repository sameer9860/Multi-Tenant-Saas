from django.contrib import admin
from .models import Lead, Client, LeadActivity, Expense

# Register your models here.
admin.site.register(Lead)
admin.site.register(Client)
admin.site.register(LeadActivity)
admin.site.register(Expense)
    