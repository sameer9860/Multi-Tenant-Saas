# apps/billing/serializers.py

from rest_framework import serializers
from .models import Usage, PaymentTransaction

class UsageSerializer(serializers.ModelSerializer):
    plan = serializers.CharField(
        source="organization.subscription.plan",
        read_only=True
    )
    invoice_limit = serializers.SerializerMethodField()

    class Meta:
        model = Usage
        fields = [
            "plan",
            "invoices_created",
            "invoice_limit",
            "updated_at",
        ]

   
    def get_invoice_limit(self, obj):
        plan = obj.organization.subscription.plan
        if plan == "BASIC":
            return 1000
        elif plan == "PRO":
            return 100000
        else:
            return 10

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'transaction_id',
            'plan',
            'amount',
            'status',
            'provider',
            'created_at',
            'updated_at'
        ]
