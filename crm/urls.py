from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ClientViewSet

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"clients", ClientViewSet, basename="client")

urlpatterns = router.urls
