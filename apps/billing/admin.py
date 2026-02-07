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

class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'amount', 'provider', 'status', 'created_at')
    list_filter = ('provider', 'status', 'plan', 'created_at')
    search_fields = ('organization__name', 'reference_id')
    readonly_fields = ('created_at',)

class PaymentAdmin(admin.ModelAdmin):
    list_display = ('organization', 'plan', 'amount', 'status', 'created_at')
    list_filter = ('plan', 'status', 'created_at')
    search_fields = ('organization__name',)
    readonly_fields = ('created_at',)

# Register your models here.
admin.site.register(PlanLimit, PlanLimitAdmin)
admin.site.register(Subscription, SubscriptionAdmin)
admin.site.register(Usage, UsageAdmin)
admin.site.register(PaymentTransaction, PaymentTransactionAdmin)
admin.site.register(Payment, PaymentAdmin)