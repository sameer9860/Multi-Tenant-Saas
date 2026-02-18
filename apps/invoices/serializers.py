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
        # organization and invoice_number are server-generated;
        # balance and status will be calculated based on paid_amount/total.
        read_only_fields = (
            'organization', 'invoice_number', 'balance', 'status', 'created_at',
        )

    def validate(self, attrs):
        # validate paid amount does not exceed total if both provided
        paid = attrs.get('paid_amount', None)
        total = attrs.get('total', None)
        if paid is not None and total is not None:
            if paid > total:
                raise serializers.ValidationError("Paid amount cannot exceed total")
        return attrs

    def to_internal_value(self, data):
        # allow legacy keys for compatibility
        if 'customer_id' in data and 'customer_input' not in data:
            data['customer_input'] = data.pop('customer_id')
        if 'customer' in data and 'customer_input' not in data and not isinstance(data.get('customer'), dict):
            # if customer passed as raw id
            data['customer_input'] = data.pop('customer')
        # also accept paid_amount and subtotal/vat/total from client (no renaming needed)
        return super().to_internal_value(data)

