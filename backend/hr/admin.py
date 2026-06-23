from django.contrib import admin
from .models import Employee, Department, Designation


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization', 'created_at']
    list_filter = ['organization']
    search_fields = ['name', 'description']


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ['name', 'department', 'organization', 'created_at']
    list_filter = ['organization', 'department']
    search_fields = ['name', 'description']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'organization', 'department', 'designation', 'status', 'employment_type', 'join_date']
    list_filter = ['status', 'employment_type', 'department']
    search_fields = ['full_name', 'email', 'phone']
