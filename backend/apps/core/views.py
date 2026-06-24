from django.conf import settings
from django.http import JsonResponse
from django.db import connection
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/
    Returns 200 if the service is up and the database is reachable.
    Safe to call without authentication — used by load balancers and deployments.
    """
    db_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        pass

    payload = {
        "status": "ok" if db_ok else "degraded",
        "database": "ok" if db_ok else "unreachable",
        "timestamp": timezone.now().isoformat(),
    }
    status_code = 200 if db_ok else 503
    return JsonResponse(payload, status=status_code)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_org(request):
    if not settings.DEBUG:
        return JsonResponse({"detail": "Not found"}, status=404)

    return JsonResponse({
        "user": request.user.email,
        "organization": str(request.organization),
    })
