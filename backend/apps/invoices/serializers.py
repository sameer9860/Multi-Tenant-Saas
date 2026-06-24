from rest_framework import serializers
from .models import Customer, Invoice, InvoiceItem, Payment
from apps.core.serializers import filter_queryset_by_organization, get_request_organization

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'organization', 'name', 'phone',
            'email', 'address', 'vat_number', 'created_at',
        ]
        read_only_fields = ('id', 'organization', 'created_at')

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'quantity', 'rate', 'total']
        read_only_fields = ['id', 'total'] # total is calculated on model save

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'organization', 'amount',
            'date', 'payment_method', 'reference', 'created_at',
        ]
        read_only_fields = ('id', 'organization', 'created_at')

    def validate_invoice(self, invoice):
        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        if org and invoice.organization_id != org.id:
            raise serializers.ValidationError("Invoice does not belong to your organization.")
        return invoice

    def validate(self, attrs):
        invoice = attrs.get('invoice')
        amount = attrs.get('amount')
        request = self.context.get('request')
        org = get_request_organization(request) if request else None

        if invoice and org and invoice.organization_id != org.id:
            raise serializers.ValidationError("Invoice does not belong to your organization.")

        if invoice and amount and not self.instance:
            if amount > invoice.remaining_due:
                raise serializers.ValidationError(
                    f"Payment amount {amount} exceeds remaining due {invoice.remaining_due}"
                )
        return attrs

from apps.core.models import Organization

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'email', 'phone', 'vat_number', 'logo']

class InvoiceSerializer(serializers.ModelSerializer):
    # read-only nested organization details
    organization = OrganizationSerializer(read_only=True)
    # read-only nested customer details
    customer = CustomerSerializer(read_only=True)
    # writable field accepts either an integer id or object with id
    customer_input = serializers.PrimaryKeyRelatedField(
        source='customer',
        queryset=Customer.objects.none(),
        write_only=True,
        required=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request is not None:
            self.fields['customer_input'].queryset = filter_queryset_by_organization(
                Customer.objects.all(), request
            )

    items = InvoiceItemSerializer(many=True, required=False)
    payments = PaymentSerializer(many=True, read_only=True)
    
    # Computed fields for the detail view
    payment_status_display = serializers.CharField(source='payment_status', read_only=True)
    remaining_due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'organization', 'customer', 'customer_input',
            'invoice_number', 'date', 'due_date',
            'subtotal', 'vat_amount', 'total',
            'paid_amount', 'balance', 'status', 'created_at',
            'items', 'payments',
            'payment_status_display', 'remaining_due', 'total_paid',
        ]
        read_only_fields = (
            'organization', 'invoice_number', 'balance', 'status', 'created_at',
            'paid_amount',
        )

    def validate(self, attrs):
        if self.instance is not None:
            locked = ('subtotal', 'vat_amount', 'total', 'paid_amount')
            for field in locked:
                if field in attrs:
                    raise serializers.ValidationError(
                        {field: 'Financial fields cannot be updated directly. Use payments API for paid_amount.'}
                    )

        paid = attrs.get('paid_amount', None)
        total = attrs.get('total', None)
        if paid is not None and total is not None:
            if paid > total and total > 0:
                raise serializers.ValidationError("Paid amount cannot exceed total")
        return attrs

    def validate_customer_input(self, customer):
        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        if org and customer.organization_id != org.id:
            raise serializers.ValidationError("Customer does not belong to your organization.")
        return customer

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        # Ensure totals are calculated correctly after items are added
        invoice.calculate_totals()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # If items are provided, replace existing ones
        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)
            
            # Recalculate totals after updating items
            instance.calculate_totals()
            instance.refresh_from_db()

        return instance

    def to_internal_value(self, data):
        # allow legacy keys for compatibility
        if 'customer_id' in data and 'customer_input' not in data:
            data['customer_input'] = data.pop('customer_id')
        if 'customer' in data and 'customer_input' not in data and not isinstance(data.get('customer'), dict):
            # if customer passed as raw id
            data['customer_input'] = data.pop('customer')
        return super().to_internal_value(data)


class LedgerEntrySerializer(serializers.Serializer):
    date = serializers.DateField()
    type = serializers.CharField()
    description = serializers.CharField()
    debit = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)

class CustomerLedgerSerializer(serializers.Serializer):
    summary = serializers.DictField()
    entries = LedgerEntrySerializer(many=True)
