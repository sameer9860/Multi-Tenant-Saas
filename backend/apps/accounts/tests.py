from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from apps.core.models import Organization
from apps.accounts.models import User


class TokenEndpointTests(APITestCase):
    def setUp(self):
        self.org = Organization.objects.create(
            name="Org",
            slug="org",
            email="org@example.com",
            phone="123",
        )
        # create a user with email and password
        self.user = User.objects.create_user(
            email="tokenuser@example.com",
            full_name="Token User",
            organization=self.org,
            password="strongpass123",
        )

    def _post_token(self, url):
        data = {"email": "tokenuser@example.com", "password": "strongpass123"}
        return self.client.post(url, data, format='json')

    def test_token_endpoint_accepts_trailing_slash(self):
        response = self._post_token('/api/token/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_token_endpoint_accepts_no_trailing_slash(self):
        response = self._post_token('/api/token')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_refresh_endpoint_accepts_no_trailing_slash(self):
        # get tokens first
        token_resp = self._post_token('/api/token/')
        refresh = token_resp.data['refresh']
        response = self.client.post('/api/token/refresh', {"refresh": refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_refresh_endpoint_accepts_trailing_slash(self):
        token_resp = self._post_token('/api/token/')
        refresh = token_resp.data['refresh']
        response = self.client.post('/api/token/refresh/', {"refresh": refresh}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
