"""
Payment Gateway Integration for Khalti & eSewa
"""
import requests
import hashlib
import hmac
from django.conf import settings
import json
import time


class KhaltiPaymentManager:
    """Handle Khalti payment integration"""
    
    def __init__(self):
        self.secret_key = settings.KHALTI_SECRET_KEY
        self.public_key = settings.KHALTI_PUBLIC_KEY
        self.api_url = "https://khalti.com/api/v2/"
    
    def initiate_payment(self, plan_id, organization_id, amount):
        """
        Initiate payment request for Khalti
        
        Args:
            plan_id: str - Plan name (FREE, BASIC, PRO)
            organization_id: int - Organization ID
            amount: int - Amount in NRS
            
        Returns:
            dict: Payment initialization response
        """
        payload = {
            "public_key": self.public_key,
            "transaction_uuid": f"txn_{organization_id}_{plan_id}_{int(time.time())}",
            "amount": amount * 100,  # Khalti uses paisa
            "product_name": f"Upgrade to {plan_id} Plan",
            "product_url": "https://yourdomain.com/billing",
            "website_url": "https://yourdomain.com",
            "return_url": "https://yourdomain.com/billing/khalti/callback/",
        }
        
        return {
            "api_url": f"{self.api_url}epayment/initiate/",
            "payload": payload
        }
    
    def verify_payment(self, token, transaction_id, amount):
        """
        Verify payment with Khalti
        
        Args:
            token: str - Khalti token from payment
            transaction_id: str - Transaction ID
            amount: int - Amount in NRS
            
        Returns:
            bool - True if payment verified
        """
        headers = {
            "Authorization": f"Key {self.secret_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "token": token,
            "amount": amount * 100
        }
        
        try:
            response = requests.post(
                f"{self.api_url}epayment/complete/",
                headers=headers,
                data=json.dumps(data),
                timeout=10
            )
            
            if response.status_code == 200:
                return True, response.json()
            else:
                return False, response.json()
        except Exception as e:
            return False, {"error": str(e)}


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
