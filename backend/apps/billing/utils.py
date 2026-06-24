from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

from .models import PaymentTransaction


def get_esewa_merchant_code():
    code = getattr(settings, 'ESEWA_MERCHANT_CODE', None)
    if code:
        return code
    if settings.DEBUG or getattr(settings, 'ESEWA_USE_MOCK', False):
        return 'EPAYTEST'
    raise ImproperlyConfigured('ESEWA_MERCHANT_CODE must be set in production')


def get_pending_payment_transaction(transaction_id):
    if not transaction_id:
        return None
    return PaymentTransaction.objects.filter(
        transaction_id=transaction_id,
        status='PENDING',
    ).first()

# NOTE: parse_payment_amount() removed — identical logic lives in
# ESewaPaymentManager._to_decimal() in payment_gateway.py.
# Import that directly if needed outside the gateway.
