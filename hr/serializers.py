from rest_framework import serializers
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id',
            'full_name',
            'phone',
            'email',
            'address',
            'department',
            'position',
            'join_date',
            'basic_salary',
            'employment_type',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
