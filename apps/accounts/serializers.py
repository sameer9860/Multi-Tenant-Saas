from rest_framework import serializers
from .models import User, OrganizationMember

class UserSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role', 'role_name']
        read_only_fields = ['role']

class OrganizationMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    phone = serializers.CharField(source='user.phone', read_only=True)
    
    role_name = serializers.CharField(source='role.name', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ['id', 'email', 'full_name', 'phone', 'role', 'role_name', 'created_at']
        read_only_fields = ['role']
