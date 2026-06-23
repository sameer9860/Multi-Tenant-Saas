"""
Payment Gateway Integration for eSewa
"""
import json
import logging
import re
from decimal import Decimal, InvalidOperation

import requests
from django.conf import settings

from .utils import get_esewa_merchant_code

logger = logging.getLogger(__name__)


class ESewaPaymentManager:
    """Handle eSewa payment verification."""

    def __init__(self):
        self.merchant_code = get_esewa_merchant_code()
        self.api_url = getattr(settings, 'ESEWA_VERIFY_URL', None)
        if not self.api_url and not (settings.DEBUG or getattr(settings, 'ESEWA_USE_MOCK', False)):
            raise ValueError('ESEWA_VERIFY_URL must be configured')

    @staticmethod
    def _to_decimal(value):
        if value is None:
            return None
        try:
            return Decimal(str(value)).quantize(Decimal('0.01'))
        except (InvalidOperation, TypeError, ValueError):
            return None

    def _parse_response(self, text):
        text = (text or '').strip()
        if not text:
            return {'verified': False, 'message': 'empty_response'}

        try:
            payload = json.loads(text)
            if isinstance(payload, dict):
                status = str(payload.get('status', '')).lower()
                if status in {'success', 'completed', 'verified'}:
                    amount = self._to_decimal(
                        payload.get('amount') or payload.get('amt') or payload.get('total_amount')
                    )
                    return {'verified': True, 'message': 'verified', 'remote_amount': amount}
                return {'verified': False, 'message': payload.get('message', 'not_verified')}
        except json.JSONDecodeError:
            pass

        lowered = text.lower()
        if 'success' in lowered or 'verified' in lowered:
            match = re.search(r'(\d+(?:\.\d+)?)', text)
            remote_amount = self._to_decimal(match.group(1)) if match else None
            return {'verified': True, 'message': 'verified', 'remote_amount': remote_amount}

        return {'verified': False, 'message': 'not_verified'}

    def verify_payment(self, transaction_id: str, amount=None, reference_id: str | None = None) -> dict:
        if not reference_id:
            return {'ok': False, 'message': 'missing_reference_id', 'remote_amount': None}

        if not self.api_url:
            return {'ok': False, 'message': 'verify_url_not_configured', 'remote_amount': None}

        expected_amount = self._to_decimal(amount)
        params = {
            'pid': transaction_id,
            'scd': self.merchant_code,
            'amt': expected_amount if expected_amount is not None else 0,
            'rid': reference_id,
        }

        try:
            logger.debug("Initiating eSewa verification: url=%s, params=%s", self.api_url, params)
            resp = requests.get(self.api_url, params=params, timeout=10)
            logger.debug("eSewa verification response: status=%s, text=%s", resp.status_code, resp.text)
        except Exception as exc:
            logger.error("eSewa verification request error for pid=%s: %s", transaction_id, exc)
            return {'ok': False, 'message': f'request error: {exc}', 'remote_amount': None}

        if resp.status_code != 200:
            logger.error(
                "eSewa verification bad response: pid=%s, status=%s",
                transaction_id,
                resp.status_code,
            )
            return {'ok': False, 'message': f'bad response: {resp.status_code}', 'remote_amount': None}

        parsed = self._parse_response(resp.text)
        if not parsed['verified']:
            return {'ok': False, 'message': parsed['message'], 'remote_amount': None}

        remote_amount = parsed.get('remote_amount')
        if expected_amount is not None and remote_amount is not None and expected_amount != remote_amount:
            return {'ok': False, 'message': 'amount_mismatch', 'remote_amount': remote_amount}

        return {'ok': True, 'message': 'verified', 'remote_amount': remote_amount}
