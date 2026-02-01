# apps/core/middleware.py

class TenantMiddleware:
    """
    Middleware to attach organization to every request
    based on the logged-in user.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Default organization = None
        request.organization = None

        if request.user.is_authenticated:
            # Attach user's organization
            request.organization = request.user.organization

        response = self.get_response(request)
        return response
