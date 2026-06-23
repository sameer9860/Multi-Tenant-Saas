from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, CustomerViewSet, InvoiceItemViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', InvoiceItemViewSet, basename='invoice-item')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = router.urls

