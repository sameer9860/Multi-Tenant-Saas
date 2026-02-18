from django.contrib import admin
from .models import Subscription, Usage, PaymentTransaction, Payment, PlanLimit

class PlanLimitInline(admin.TabularInline):
    model = PlanLimit
    extra = 1

class PlanLimitAdmin(admin.ModelAdmin):
    list_display = ('plan', 'feature', 'limit_value')
    list_filter = ('plan', 'feature')
    search_fields = ('plan', 'feature')

class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'is_active', 'start_date', 'end_date')
    list_filter = ('plan', 'is_active')
    search_fields = ('organization__name',)

class UsageAdmin(admin.ModelAdmin):
    list_display = ('organization', 'invoices_created', 'customers_created', 'team_members_added')
    list_filter = ('updated_at',)
    search_fields = ('organization__name',)
    readonly_fields = ('updated_at',)

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    """Full payment audit trail visible to admins"""
    
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
        """Payments should only be created via API"""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Never delete payment records"""
        return False

class PaymentAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'amount', 'status', 'created_at')
    list_filter = ('plan', 'status', 'created_at')
    search_fields = ('organization__name',)
    readonly_fields = ('created_at',)

# Register your models here.
admin.site.register(PlanLimit, PlanLimitAdmin)
admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(Usage, UsageAdmin)
admin.site.register(Payment, PaymentAdmin)
