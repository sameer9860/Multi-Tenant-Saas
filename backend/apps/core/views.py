from django.conf import settings
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_org(request):
    if not settings.DEBUG:
        return JsonResponse({"detail": "Not found"}, status=404)

    return JsonResponse({
        "user": request.user.email,
        "organization": str(request.organization),
    })
