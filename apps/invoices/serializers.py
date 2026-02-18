from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem, InvoicePayment

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ('organization',)

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'

class InvoicePaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoicePayment
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    # read-only nested customer details
    customer = CustomerSerializer(read_only=True)
    # writable field accepts either an integer id or object with id
    customer_input = serializers.PrimaryKeyRelatedField(
        source='customer',
        queryset=Customer.objects.all(),
        write_only=True,
        required=True,
    )

    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = InvoicePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        # fields: expose nested customer + a separate input key
        fields = [
            'id', 'organization', 'customer', 'customer_input',
            'invoice_number', 'date', 'due_date',
            'subtotal', 'vat_amount', 'total',
            'paid_amount', 'balance', 'status', 'created_at',
            'items', 'payments',
        ]
        read_only_fields = (
            'organization', 'invoice_number', 'paid_amount', 'balance',
            'status', 'subtotal', 'vat_amount', 'total', 'created_at',
        )

    def validate(self, attrs):
        # ensure total fields are not sent by client (they're read-only)
        # any other custom validation can go here
        return attrs

    def to_internal_value(self, data):
        # allow legacy keys for compatibility
        if 'customer_id' in data and 'customer_input' not in data:
            data['customer_input'] = data.pop('customer_id')
        if 'customer' in data and 'customer_input' not in data and not isinstance(data.get('customer'), dict):
            # if customer passed as raw id
            data['customer_input'] = data.pop('customer')
        return super().to_internal_value(data)

