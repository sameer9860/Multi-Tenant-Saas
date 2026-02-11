from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, ClientViewSet

router = DefaultRouter()
router.register(r"leads", LeadViewSet)
router.register(r"clients", ClientViewSet)

urlpatterns = router.urls
