from rest_framework import serializers
from .models import User, OrganizationMember

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'role']

class OrganizationMemberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = OrganizationMember
        fields = ['id', 'email', 'full_name', 'role', 'created_at']
