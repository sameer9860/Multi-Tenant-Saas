from django.contrib import admin
from apps.core.admin_mixins import TenantScopedModelAdmin
from .models import Service, Staff, Appointment, AppointmentReminder


@admin.register(Service)
class ServiceAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'duration_minutes', 'price')


@admin.register(Staff)
class StaffAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'role')


@admin.register(Appointment)
class AppointmentAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'customer', 'staff', 'date', 'time', 'status')
    list_filter = ('status', 'organization')


@admin.register(AppointmentReminder)
class AppointmentReminderAdmin(TenantScopedModelAdmin):
    tenant_field = None
    tenant_lookup = 'appointment__organization'
    list_display = ('appointment', 'reminder_type', 'scheduled_for', 'status')
    list_filter = ('status', 'reminder_type')
