from rest_framework import serializers
from .models import Service, Staff, StaffAvailability, Appointment
from apps.invoices.models import Customer

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

class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    staff_name = serializers.CharField(source='staff.name', read_only=True)

    # Fields for creating a new customer on the fly
    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(),
        required=False,
        allow_null=True
    )
    new_customer_name = serializers.CharField(write_only=True, required=False)
    new_customer_phone = serializers.CharField(write_only=True, required=False)
    new_customer_email = serializers.EmailField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('organization', 'created_at')

    def validate(self, data):
        if not data.get('customer') and not data.get('new_customer_name'):
            raise serializers.ValidationError(
                "Either an existing customer or new customer details must be provided."
            )
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        new_customer_name = validated_data.pop('new_customer_name', None)
        new_customer_phone = validated_data.pop('new_customer_phone', None)
        new_customer_email = validated_data.pop('new_customer_email', None)

        if new_customer_name:
            # Create a new customer for the organization
            customer = Customer.objects.create(
                organization=user.organization,
                name=new_customer_name,
                phone=new_customer_phone,
                email=new_customer_email
            )
            validated_data['customer'] = customer
        
        validated_data['organization'] = user.organization
        return super().create(validated_data)
