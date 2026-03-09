from django.db import models
from apps.core.models import Organization
from django.conf import settings


class Department(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='departments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.organization.name})"

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'organization']


class Designation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='designations'
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='designations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.department.name} ({self.organization.name})"

    class Meta:
        ordering = ['name']
        unique_together = ['name', 'department', 'organization']


class Employee(models.Model):

    EMPLOYMENT_TYPE_CHOICES = [
        ('FULL_TIME', 'Full Time'),
        ('PART_TIME', 'Part Time'),
        ('CONTRACT', 'Contract'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('RESIGNED', 'Resigned'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='employees'
    )

    # Personal Information
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Job Information
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='employees'
    )
    designation = models.ForeignKey(
        Designation,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='employees'
    )
    join_date = models.DateField(blank=True, null=True)

    # Salary & Employment
    basic_salary = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00
    )
    employment_type = models.CharField(
        max_length=20,
        choices=EMPLOYMENT_TYPE_CHOICES,
        default='FULL_TIME'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.full_name} ({self.organization.name})"

    class Meta:
        ordering = ['-created_at']

class Attendance(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LEAVE', 'Leave'),
        ('HALF_DAY', 'Half Day'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='attendance_records'
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='PRESENT'
    )
    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'employee__full_name']
        unique_together = ['organization', 'employee', 'date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.date} ({self.status})"


class LeaveRequest(models.Model):
    LEAVE_TYPE_CHOICES = [
        ('CASUAL', 'Casual Leave'),
        ('SICK', 'Sick Leave'),
        ('ANNUAL', 'Annual Leave'),
        ('UNPAID', 'Unpaid Leave'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    leave_type = models.CharField(
        max_length=20,
        choices=LEAVE_TYPE_CHOICES,
        default='CASUAL'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leaves'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.employee.full_name} - {self.leave_type} ({self.status})"
