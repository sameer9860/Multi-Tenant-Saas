"""CRM security and functionality tests."""
from django.urls import reverse
from rest_framework import status
from apps.core.test_helpers import BaseAPITestCase, make_org, make_user, auth_client
from crm.models import Lead, Client, Note, Expense


class LeadIDORTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        # Lead belonging to org A
        self.lead = Lead.objects.create(
            organization=self.org,
            name="Org A Lead",
            status="NEW"
        )
        # Lead belonging to org B
        self.other_lead = Lead.objects.create(
            organization=self.other_org,
            name="Org B Lead",
            status="NEW"
        )

    def test_owner_can_list_own_leads_only(self):
        url = reverse('lead-list')
        resp = self.owner_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        names = [r['name'] for r in results]
        self.assertIn("Org A Lead", names)
        self.assertNotIn("Org B Lead", names)

    def test_other_org_cannot_access_lead_detail(self):
        url = reverse('lead-detail', kwargs={'pk': self.lead.pk})
        resp = self.other_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_staff_can_read_leads(self):
        url = reverse('lead-list')
        resp = self.staff_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_staff_cannot_delete_lead(self):
        url = reverse('lead-detail', kwargs={'pk': self.lead.pk})
        resp = self.staff_client.delete(url)
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_create_lead(self):
        url = reverse('lead-list')
        resp = self.owner_client.post(url, {"name": "New Lead", "status": "NEW"}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data['name'], "New Lead")

    def test_unauthenticated_cannot_access_leads(self):
        from rest_framework.test import APIClient
        url = reverse('lead-list')
        resp = APIClient().get(url)
        self.assertIn(resp.status_code, [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN
        ])


class NoteIDORTests(BaseAPITestCase):

    def setUp(self):
        super().setUp()
        self.lead = Lead.objects.create(organization=self.org, name="Lead", status="NEW")
        self.other_lead = Lead.objects.create(organization=self.other_org, name="Other Lead", status="NEW")

    def test_cannot_create_note_for_other_org_lead(self):
        """FK scoping must reject notes pointing to another org's lead."""
        url = reverse('note-list')
        resp = self.owner_client.post(url, {
            "lead": self.other_lead.pk,
            "content": "Injected note"
        }, format='json')
        # Must be rejected — 400 (validation) or 403
        self.assertIn(resp.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN
        ])

    def test_note_list_scoped_to_org(self):
        Note.objects.create(
            organization=self.org, lead=self.lead,
            user=self.owner, content="Org A note"
        )
        Note.objects.create(
            organization=self.other_org, lead=self.other_lead,
            user=self.other_owner, content="Org B note"
        )
        url = reverse('note-list')
        resp = self.owner_client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data if isinstance(resp.data, list) else resp.data.get('results', [])
        contents = [r['content'] for r in results]
        self.assertIn("Org A note", contents)
        self.assertNotIn("Org B note", contents)


class ExpenseValidationTests(BaseAPITestCase):

    def test_negative_expense_rejected(self):
        url = reverse('expense-list')
        resp = self.owner_client.post(url, {
            "title": "Bad Expense",
            "amount": "-100.00",
            "category": "Test"
        }, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
