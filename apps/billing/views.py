from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework import serializers
class UpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        subscription = request.organization.subscription
        subscription.plan = plan
        subscription.save()
        return Response({"message": f"Upgraded to {plan}"})
    
# apps/billing/views.py



class UsageDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        usage = request.organization.usage
        serializer = UsageSerializer(usage)
        return Response(serializer.data)
    
