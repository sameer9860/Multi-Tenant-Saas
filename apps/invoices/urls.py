from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, CustomerViewSet, InvoiceItemViewSet, InvoicePaymentViewSet

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'invoice-items', InvoiceItemViewSet, basename='invoice-item')
router.register(r'invoice-payments', InvoicePaymentViewSet, basename='invoice-payment')

urlpatterns = router.urls

