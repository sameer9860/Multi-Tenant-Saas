from django.contrib import admin
from .models import Invoice, InvoiceItem, Customer, InvoicePayment
# Register your models here.
admin.site.register(Invoice)
admin.site.register(InvoiceItem)
admin.site.register(Customer)
admin.site.register(InvoicePayment)