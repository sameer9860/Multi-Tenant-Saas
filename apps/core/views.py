# apps/core/views.py
from django.http import JsonResponse

def test_org(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "user": request.user.email,
            "organization": str(request.organization)
        })
    else:
        return JsonResponse({"detail": "Not authenticated"})
