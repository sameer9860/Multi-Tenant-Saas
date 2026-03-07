from rest_framework import serializers
from .models import Employee, Department, Designation, Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'employee',
            'employee_name',
            'date',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']



class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class DesignationSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Designation
        fields = ['id', 'name', 'description', 'department', 'department_name', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    designation_name = serializers.CharField(source='designation.name', read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id',
            'full_name',
            'phone',
            'email',
            'address',
            'department',
            'department_name',
            'designation',
            'designation_name',
            'join_date',
            'basic_salary',
            'employment_type',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
