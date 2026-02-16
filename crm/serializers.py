from rest_framework import serializers
from .models import Lead, Client, LeadActivity

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
