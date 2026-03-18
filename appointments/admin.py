from django.contrib import admin
from .models import Service, Staff, Appointment

# Register your models here.
admin.site.register(Service)
admin.site.register(Staff)
admin.site.register(Appointment)