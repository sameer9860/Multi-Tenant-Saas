from rest_framework import serializers
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder

class NoteSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)
    class Meta:
        model = Note
        fields = "__all__"
        read_only_fields = ["organization", "user"]

class InteractionSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)
    class Meta:
        model = Interaction
        fields = "__all__"
        read_only_fields = ["organization", "user"]

class ReminderSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source="user", read_only=True)
    lead_name = serializers.CharField(source="lead.name", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    class Meta:
        model = Reminder
        fields = "__all__"
        read_only_fields = ["organization", "user"]

class LeadActivitySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    lead_name = serializers.CharField(source="lead.name", read_only=True)
    class Meta:
        model = LeadActivity
        fields = ["id", "organization", "lead", "lead_name", "user", "action", "old_value", "new_value", "created_at"]

class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = "__all__"
        read_only_fields = ["organization"]


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"
        read_only_fields = ["organization"]


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"
        read_only_fields = ["organization"]
