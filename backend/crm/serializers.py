from rest_framework import serializers
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder, Tag


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
    # Using StringRelatedField is safer for null foreign keys
    lead_name = serializers.StringRelatedField(source="lead", read_only=True)
    client_name = serializers.StringRelatedField(source="client", read_only=True)
    class Meta:
        model = Reminder
        fields = "__all__"
        read_only_fields = ["organization", "user"]

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = "__all__"
        read_only_fields = ["organization"]

class LeadActivitySerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField()
    lead_name = serializers.StringRelatedField(source="lead", read_only=True)
    class Meta:
        model = LeadActivity
        fields = ["id", "organization", "lead", "lead_name", "user", "action", "old_value", "new_value", "created_at"]

class LeadSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.StringRelatedField(source="assigned_to", read_only=True)
    tags_detail = TagSerializer(source="tags", many=True, read_only=True)
    
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
