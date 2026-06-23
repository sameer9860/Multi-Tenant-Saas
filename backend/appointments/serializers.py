from rest_framework import serializers
from .models import Service, Staff, StaffAvailability, Appointment
from apps.invoices.models import Customer
from apps.core.serializers import filter_queryset_by_organization, get_request_organization

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'
        read_only_fields = ('organization', 'created_at')

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ('organization', 'created_at')

class StaffAvailabilitySerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    staff_name = serializers.CharField(source='staff.name', read_only=True)

    class Meta:
        model = StaffAvailability
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request is not None:
            self.fields['staff'].queryset = filter_queryset_by_organization(
                Staff.objects.all(), request
            )

class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    staff_name = serializers.CharField(source='staff.name', read_only=True)

    customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.none(),
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request is not None:
            self.fields['customer'].queryset = filter_queryset_by_organization(
                Customer.objects.all(), request
            )
            self.fields['service'].queryset = filter_queryset_by_organization(
                Service.objects.all(), request
            )
            self.fields['staff'].queryset = filter_queryset_by_organization(
                Staff.objects.all(), request
            )

    def validate(self, data):
        if not data.get('customer') and not data.get('new_customer_name'):
            raise serializers.ValidationError(
                "Either an existing customer or new customer details must be provided."
            )

        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        for field_name in ('service', 'staff'):
            related = data.get(field_name)
            if related and org and related.organization_id != org.id:
                raise serializers.ValidationError(
                    {field_name: f"{field_name.title()} does not belong to your organization."}
                )
        return data

    def create(self, validated_data):
        request = self.context['request']
        org = get_request_organization(request)
        new_customer_name = validated_data.pop('new_customer_name', None)
        new_customer_phone = validated_data.pop('new_customer_phone', None)
        new_customer_email = validated_data.pop('new_customer_email', None)

        if new_customer_name:
            customer = Customer.objects.create(
                organization=org,
                name=new_customer_name,
                phone=new_customer_phone,
                email=new_customer_email
            )
            validated_data['customer'] = customer

        validated_data.pop('organization', None)
        return super().create(validated_data)
