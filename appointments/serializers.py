from rest_framework import serializers
from .models import Service, Staff, StaffAvailability

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ('organization', 'created_at')

    def create(self, validated_data):
        # Automatically assign the organization from the user's profile
        user = self.context['request'].user
        validated_data['organization'] = user.organization
        return super().create(validated_data)

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ('organization', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['organization'] = user.organization
        return super().create(validated_data)

class StaffAvailabilitySerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    staff_name = serializers.CharField(source='staff.name', read_only=True)

    class Meta:
        model = StaffAvailability
        fields = '__all__'
