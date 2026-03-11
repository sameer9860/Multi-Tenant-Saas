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


class SalaryAdvance(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='salary_advances'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='salary_advances'
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    deduct_in_month = models.DateField()  # Store as 1st day of the month
    is_deducted = models.BooleanField(default=False)
    reason = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.full_name} - {self.amount} ({self.deduct_in_month.strftime('%B %Y')})"


class Payroll(models.Model):
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('FINALIZED', 'Finalized'),
        ('PAID', 'Paid'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='payrolls'
    )
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='payrolls'
    )
    month = models.DateField() # Store as 1st day of the month
    
    # Financial fields
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Attendance summary for the month
    working_days = models.IntegerField(default=30)
    present_days = models.IntegerField(default=0)
    absent_days = models.IntegerField(default=0)
    leave_days = models.IntegerField(default=0)
    half_days = models.IntegerField(default=0)
    
    # Adjustments
    allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    absence_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    advance_deduction = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Final amounts
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-month', 'employee__full_name']
        unique_together = ['organization', 'employee', 'month']

    def calculate_net_salary(self):
        """
        Calculate net salary based on basic, allowances, deductions, and absence deduction.
        If basic_salary or working_days are 0, we assume no baseline income is provided here.
        """
        if self.working_days > 0:
            daily_rate = float(self.basic_salary) / float(self.working_days)
            # Absence deduction: full day absent + half days
            total_absent_value = float(self.absent_days) + (float(self.half_days) * 0.5)
            self.absence_deduction = round(daily_rate * total_absent_value, 2)
        else:
            self.absence_deduction = 0.00
            
        self.net_salary = float(self.basic_salary) + float(self.allowances) - float(self.deductions) - float(self.absence_deduction) - float(self.advance_deduction)
        
        # Ensure net_salary doesn't go negative arbitrarily, though legally possible with high deductions.
        if self.net_salary < 0:
            self.net_salary = 0.00
            
        return self.net_salary

    def save(self, *args, **kwargs):
        self.calculate_net_salary()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.full_name} - {self.month.strftime('%B %Y')} - {self.status}"
