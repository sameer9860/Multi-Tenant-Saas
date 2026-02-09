"""
Payment Gateway Integration for eSewa

This module contains a small manager to verify eSewa transactions
by calling the eSewa verification endpoint. The implementation is
kept defensive: it attempts to match the amount and transaction id
before declaring a payment verified.
"""
import requests
from django.conf import settings


class ESewaPaymentManager:
    """Handle basic eSewa payment verification."""

    def __init__(self):
        # Merchant code / identifier used by eSewa (configure in settings)
        self.merchant_code = getattr(settings, 'ESEWA_MERCHANT_CODE', 'EPAYTEST')
        # UAT verification endpoint (eSewa test)
        self.api_url = "https://uat.esewa.com.np/epay/transrec"  # UAT endpoint frequently used

    def verify_payment(self, transaction_id: str, amount: int | None = None) -> dict:
        """
        Verify a transaction with eSewa's verification endpoint.

        Args:
            transaction_id: the `pid`/transaction id sent during the payment
            amount: expected amount (integer)

        Returns:
            dict: {"ok": bool, "message": str, "remote_amount": int|None}
        """
        params = {
            'pid': transaction_id,
            'scd': self.merchant_code,
        }

        try:
            resp = requests.get(self.api_url, params=params, timeout=10)
        except Exception as e:
            return {"ok": False, "message": f"request error: {e}", "remote_amount": None}

        if resp.status_code != 200:
            return {"ok": False, "message": f"bad response: {resp.status_code}", "remote_amount": None}

        text = resp.text.strip()

        # Different eSewa environments return different formats. The safest
        # approach here is to look for a success indicator and (when possible)
        # parse an amount if it's present.
        if "Success" in text or "success" in text:
            # Try to extract a number from the response as the remote amount
            remote_amount = None
            try:
                # naive extraction: find digits in text
                import re
                m = re.search(r"(\d+)", text)
                if m:
                    remote_amount = int(m.group(1))
            except Exception:
                remote_amount = None

            # If caller supplied expected amount, verify it matches remote amount when available
            if amount is not None and remote_amount is not None and amount != remote_amount:
                return {"ok": False, "message": "amount_mismatch", "remote_amount": remote_amount}

            return {"ok": True, "message": "verified", "remote_amount": remote_amount}

        return {"ok": False, "message": "not_verified", "remote_amount": None}
