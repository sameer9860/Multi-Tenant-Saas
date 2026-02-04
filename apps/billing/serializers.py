# apps/billing/serializers.py

from rest_framework import serializers
from .models import Usage

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
        return 10 if plan == "FREE" else 100
