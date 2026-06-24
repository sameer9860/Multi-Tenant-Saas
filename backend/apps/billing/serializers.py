from rest_framework import serializers
from .models import Usage, PaymentTransaction, Payment


class UsageSerializer(serializers.ModelSerializer):
    plan = serializers.CharField(
        source="organization.subscription.plan",
        read_only=True
    )
    invoice_limit = serializers.SerializerMethodField()
    customer_limit = serializers.SerializerMethodField()
    team_member_limit = serializers.SerializerMethodField()

    class Meta:
        model = Usage
        fields = [
            "plan",
            "invoices_created",
            "invoice_limit",
            "customers_created",
            "customer_limit",
            "team_members_added",
            "team_member_limit",
            "updated_at",
        ]

    def _limit(self, obj, feature):
        """Return the plan limit for a feature; None means unlimited."""
        raw = obj.get_plan_limit(feature)
        return None if raw == -1 else raw

    def get_invoice_limit(self, obj):
        return self._limit(obj, 'invoices')

    def get_customer_limit(self, obj):
        return self._limit(obj, 'customers')

    def get_team_member_limit(self, obj):
        return self._limit(obj, 'team_members')


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
            'updated_at',
        ]


class PaymentSerializer(serializers.ModelSerializer):
    provider = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id',
            'transaction_id',
            'plan',
            'amount',
            'status',
            'created_at',
            'provider',
        ]

    def get_provider(self, obj):
        return "eSewa"
