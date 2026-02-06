from django.contrib import admin
from .models import Subscription, Usage ,PaymentTransaction,Payment

# Register your models here.
admin.site.register(Subscription)
admin.site.register(Usage)
admin.site.register(PaymentTransaction)
admin.site.register(Payment)