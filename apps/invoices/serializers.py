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
    # include nested customer details on read, but allow writing by ID
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        source='customer',
        queryset=Customer.objects.all(),
        write_only=True,
        required=True,
    )

    items = InvoiceItemSerializer(many=True, read_only=True)
    payments = InvoicePaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Invoice
        # include both customer and customer_id, plus all other fields
        fields = [
            'id', 'organization', 'customer', 'customer_id', 'invoice_number',
            'date', 'due_date', 'subtotal', 'vat_amount', 'total',
            'paid_amount', 'balance', 'status', 'created_at',
            'items', 'payments',
        ]
        read_only_fields = (
            'organization', 'invoice_number', 'paid_amount', 'balance',
            'status', 'subtotal', 'vat_amount', 'total', 'created_at',
        )

