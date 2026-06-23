from django.contrib import admin
from apps.core.admin_mixins import TenantScopedModelAdmin
from .models import Lead, Client, LeadActivity, Expense, Note, Interaction, Reminder, Tag


@admin.register(Lead)
class LeadAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'status', 'assigned_to', 'created_at')
    list_filter = ('status', 'organization')
    search_fields = ('name', 'email')


@admin.register(Client)
class ClientAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'email', 'company', 'created_at')
    list_filter = ('organization',)
    search_fields = ('name', 'email', 'company')


@admin.register(LeadActivity)
class LeadActivityAdmin(TenantScopedModelAdmin):
    list_display = ('lead', 'organization', 'user', 'action', 'created_at')
    list_filter = ('organization',)
    search_fields = ('lead__name', 'action')


@admin.register(Expense)
class ExpenseAdmin(TenantScopedModelAdmin):
    list_display = ('title', 'organization', 'amount', 'category', 'created_at')
    list_filter = ('organization', 'category')
    search_fields = ('title',)


@admin.register(Note)
class NoteAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'lead', 'client', 'user', 'created_at')
    list_filter = ('organization',)


@admin.register(Interaction)
class InteractionAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'type', 'lead', 'client', 'date')
    list_filter = ('organization', 'type')


@admin.register(Reminder)
class ReminderAdmin(TenantScopedModelAdmin):
    list_display = ('title', 'organization', 'remind_at', 'is_completed')
    list_filter = ('organization', 'is_completed')


@admin.register(Tag)
class TagAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'color')
    list_filter = ('organization',)
