from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    LeadViewSet, ClientViewSet, DashboardView, LeadActivityViewSet, 
    ExpenseViewSet, NoteViewSet, InteractionViewSet, ReminderViewSet,
    TagViewSet
)

router = DefaultRouter()
router.register(r"leads", LeadViewSet, basename="lead")
router.register(r"clients", ClientViewSet, basename="client")
router.register(r"activities", LeadActivityViewSet, basename="activity")
router.register(r"expenses", ExpenseViewSet, basename="expense")
router.register(r"notes", NoteViewSet, basename="note")
router.register(r"interactions", InteractionViewSet, basename="interaction")
router.register(r"reminders", ReminderViewSet, basename="reminder")
router.register(r"tags", TagViewSet, basename="tag")

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
] + router.urls
