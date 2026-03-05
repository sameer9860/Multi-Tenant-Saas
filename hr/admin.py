from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'organization', 'department', 'position', 'status', 'employment_type', 'join_date']
    list_filter = ['status', 'employment_type', 'department']
    search_fields = ['full_name', 'email', 'phone']
