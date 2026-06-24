from rest_framework import serializers
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder, Tag
from apps.accounts.models import OrganizationMember
from apps.core.serializers import get_request_organization
from apps.invoices.models import Customer


class OrgScopedCrmSerializerMixin:
    """Validate lead/client/customer FKs belong to the request organization."""

    org_fk_fields = ('lead', 'client', 'customer')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        if not org:
            return
        if 'lead' in self.fields:
            self.fields['lead'].queryset = Lead.objects.filter(organization=org)
        if 'client' in self.fields:
            self.fields['client'].queryset = Client.objects.filter(organization=org)
        if 'customer' in self.fields:
            self.fields['customer'].queryset = Customer.objects.filter(organization=org)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        if not org:
            return attrs
        for field in self.org_fk_fields:
            obj = attrs.get(field)
            if obj is not None and obj.organization_id != org.id:
                raise serializers.ValidationError(
                    {field: 'Must belong to your organization.'}
                )
        return attrs


class NoteSerializer(OrgScopedCrmSerializerMixin, serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'organization', 'lead', 'client', 'customer',
            'user', 'user_name', 'content', 'created_at',
        ]
        read_only_fields = ['id', 'organization', 'user', 'created_at']


class InteractionSerializer(OrgScopedCrmSerializerMixin, serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)

    class Meta:
        model = Interaction
        fields = [
            'id', 'organization', 'lead', 'client', 'customer',
            'user', 'user_name', 'type', 'summary', 'date', 'created_at',
        ]
        read_only_fields = ['id', 'organization', 'user', 'created_at']


class ReminderSerializer(OrgScopedCrmSerializerMixin, serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)
    lead_name = serializers.StringRelatedField(source="lead", read_only=True)
    client_name = serializers.StringRelatedField(source="client", read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'id', 'organization', 'lead', 'lead_name', 'client', 'client_name',
            'customer', 'user', 'user_name', 'title', 'description',
            'remind_at', 'is_completed', 'created_at',
        ]
        read_only_fields = ['id', 'organization', 'user', 'created_at']


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'organization', 'name', 'color']
        read_only_fields = ['id', 'organization']


class LeadActivitySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    lead_name = serializers.StringRelatedField(source="lead", read_only=True)

    class Meta:
        model = LeadActivity
        fields = [
            'id', 'organization', 'lead', 'lead_name',
            'user', 'action', 'old_value', 'new_value', 'created_at',
        ]


class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source="assigned_to", read_only=True)
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'organization', 'name', 'email', 'phone', 'source',
            'status', 'assigned_to', 'assigned_to_name',
            'tags', 'tags_detail', 'created_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at']

    def validate_assigned_to(self, user):
        if user is None:
            return user
        request = self.context.get('request')
        org = get_request_organization(request) if request else None
        if org and not OrganizationMember.objects.filter(user=user, organization=org).exists():
            raise serializers.ValidationError("Assigned user must belong to your organization.")
        return user


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = [
            'id', 'organization', 'name', 'email',
            'phone', 'company', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'organization', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'organization', 'title', 'amount', 'category', 'created_at']
        read_only_fields = ['id', 'organization', 'created_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be positive.")
        return value