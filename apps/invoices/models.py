from decimal import Decimal
from django.db import models, transaction
from django.utils import timezone
from apps.core.models import Organization

class Customer(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="customers"
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Invoice(models.Model):
    STATUS_CHOICES = [
        ("DUE", "Due"),
        ("PARTIAL", "Partial"),
        ("PAID", "Paid"),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="invoices"
    )
    invoice_number = models.CharField(max_length=50)
    date = models.DateField()
    due_date = models.DateField(blank=True, null=True)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vat_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="DUE"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "invoice_number")

    def __str__(self):
        return self.invoice_number

    @property
    def total_paid(self):
        return sum(payment.amount for payment in self.payments.all())

    @property
    def remaining_due(self):
        return self.total - self.total_paid

    @property
    def payment_status(self):
        paid = self.total_paid
        if paid == 0:
            return "Unpaid"
        elif paid < self.total:
            return "Partially Paid"
        else:
            return "Paid"

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # select_for_update locks the last invoice row so concurrent
            # saves cannot generate the same number (race-condition safe)
            last_invoice = Invoice.objects.select_for_update().filter(
                organization=self.organization
            ).order_by("-created_at").first()

            if last_invoice and last_invoice.invoice_number:
                try:
                    last_number = int(last_invoice.invoice_number.split("-")[-1])
                    new_number = last_number + 1
                except (ValueError, IndexError):
                    new_number = 1
            else:
                new_number = 1

            self.invoice_number = f"INV-{new_number:05d}"
        
        # Always update balance from total and paid_amount
        from decimal import Decimal
        self.balance = Decimal(str(self.total)) - Decimal(str(self.paid_amount))
        super().save(*args, **kwargs)

    def calculate_totals(self):
        items = self.items.all()
        if items.exists():
            new_subtotal = sum(item.total for item in items)
            
            # Try to preserve current VAT ratio if subtotal changes
            if self.subtotal > 0:
                ratio = self.vat_amount / self.subtotal
            else:
                ratio = Decimal('0.13') # fallback to 13%
                
            self.subtotal = new_subtotal
            self.vat_amount = self.subtotal * ratio
            self.total = self.subtotal + self.vat_amount
        
        self.balance = self.total - self.paid_amount
        self.save()

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items"
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total = self.quantity * self.rate
        super().save(*args, **kwargs)

class Payment(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=50) # cash, esewa, bank
    reference = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.id: # only for new payments
            if self.amount > self.invoice.remaining_due:
                from django.core.exceptions import ValidationError
                raise ValidationError(f"Payment amount {self.amount} exceeds remaining due {self.invoice.remaining_due}")
        
        super().save(*args, **kwargs)

        # Update invoice after payment
        invoice = self.invoice
        paid_sum = invoice.total_paid
        invoice.paid_amount = paid_sum
        invoice.balance = invoice.total - invoice.paid_amount

        # Map property to field for backward compatibility or keep it separate?
        # User said "No need to store status manually", but they kept STATUS_CHOICES in their draft.
        # Let's update the field so existing queries still work.
        status_map = {
            "Unpaid": "DUE",
            "Partially Paid": "PARTIAL",
            "Paid": "PAID"
        }
        invoice.status = status_map.get(invoice.payment_status, "DUE")
        invoice.save()

