from django.contrib import admin
from apps.core.admin_mixins import ProductionSafeAdminMixin, TenantScopedModelAdmin
from .models import Subscription, Usage, PaymentTransaction, Payment, PlanLimit


class PlanLimitInline(admin.TabularInline):
    model = PlanLimit
    extra = 1


@admin.register(PlanLimit)
class PlanLimitAdmin(ProductionSafeAdminMixin, admin.ModelAdmin):
    list_display = ('plan', 'feature', 'limit_value')
    list_filter = ('plan', 'feature')
    search_fields = ('plan', 'feature')


@admin.register(Subscription)
class SubscriptionAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'plan', 'is_active', 'start_date', 'end_date')
    list_filter = ('plan', 'is_active')
    search_fields = ('organization__name',)


@admin.register(Usage)
class UsageAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'invoices_created', 'customers_created', 'team_members_added')
    list_filter = ('updated_at',)
    search_fields = ('organization__name',)
    readonly_fields = ('updated_at',)


@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(TenantScopedModelAdmin):
    list_display = (
        "id",
        "organization",
        "plan",
        "amount",
        "provider",
        "status",
        "created_at",
    )
    list_filter = (
        "status",
        "plan",
        "provider",
        "created_at",
    )
    search_fields = (
        "organization__name",
        "transaction_id",
        "reference_id",
    )
    readonly_fields = (
        "id",
        "transaction_id",
        "created_at",
        "updated_at",
    )
    fieldsets = (
        ("Payment Info", {
            "fields": ("id", "transaction_id", "reference_id", "provider")
        }),
        ("Organization & Plan", {
            "fields": ("organization", "plan", "amount")
        }),
        ("Status", {
            "fields": ("status", "created_at", "updated_at")
        }),
    )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Payment)
class PaymentAdmin(TenantScopedModelAdmin):
    list_display = ('organization', 'plan', 'amount', 'status', 'created_at')
    list_filter = ('plan', 'status', 'created_at')
    search_fields = ('organization__name',)
    readonly_fields = ('created_at',)
