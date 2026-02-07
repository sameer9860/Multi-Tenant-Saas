"""
Payment Gateway Integration for eSewa
"""
import requests
import hashlib
import hmac
from django.conf import settings
import json
import time


class ESewaPaymentManager:
    """Handle eSewa payment integration"""
    
    def __init__(self):
        self.merchant_code = settings.ESEWA_MERCHANT_CODE
        self.merchant_secret = settings.ESEWA_MERCHANT_SECRET
        self.api_url = "https://uat.esewa.com.np/api/epay/verify/"  # Test URL
    
    def generate_hash(self, data_string):
        """Generate HMAC-MD5 hash for eSewa"""
        hash_obj = hmac.new(
            self.merchant_secret.encode(),
            data_string.encode(),
            hashlib.md5
        )
        return hash_obj.hexdigest()
    
    def verify_payment(self, transaction_code, status, signature):
        """
        Verify payment with eSewa
        
        Args:
            transaction_code: str - Transaction code from eSewa
            status: str - Payment status (COMPLETE, FAILED, etc.)
            signature: str - Signature from eSewa
            
        Returns:
            bool - True if payment verified
        """
        params = {
            "q": "bl",
            "ee": self.merchant_code,
            "tr": transaction_code,
        }
        
        try:
            response = requests.get(
                self.api_url,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.text
                # eSewa returns "Success" for valid transactions
                return result == "Success"
            return False
        except Exception as e:
            print(f"eSewa verification error: {str(e)}")
            return False
