from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = request.data.get('plan')
        subscription = request.organization.subscription
        subscription.plan = plan
        subscription.save()
        return Response({"message": f"Upgraded to {plan}"})
