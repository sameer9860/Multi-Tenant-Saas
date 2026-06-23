from django.contrib import admin
from apps.core.admin_mixins import TenantScopedModelAdmin
from .models import Invoice, InvoiceItem, Customer, Payment


@admin.register(Invoice)
class InvoiceAdmin(TenantScopedModelAdmin):
    list_display = ('invoice_number', 'organization', 'customer', 'total', 'status', 'date')
    list_filter = ('status', 'organization')
    search_fields = ('invoice_number', 'customer__name')


@admin.register(InvoiceItem)
class InvoiceItemAdmin(TenantScopedModelAdmin):
    tenant_field = None
    tenant_lookup = 'invoice__organization'
    list_display = ('invoice', 'description', 'quantity', 'rate', 'total')


@admin.register(Customer)
class CustomerAdmin(TenantScopedModelAdmin):
    list_display = ('name', 'organization', 'email', 'phone')
    list_filter = ('organization',)
    search_fields = ('name', 'email')


@admin.register(Payment)
class InvoicePaymentAdmin(TenantScopedModelAdmin):
    list_display = ('invoice', 'organization', 'amount', 'date', 'payment_method')
    list_filter = ('organization', 'payment_method')
