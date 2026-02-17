from django.db import models
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

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last_invoice = Invoice.objects.filter(
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
        super().save(*args, **kwargs)

    def calculate_totals(self):
        items = self.items.all()
        self.subtotal = sum(item.total for item in items)
        self.vat_amount = self.subtotal * 0.13  # example 13% VAT
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

class InvoicePayment(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Update invoice after payment
        invoice = self.invoice
        # Use F() expressions for better concurrency safety if needed, 
        # but here we follow the user's provided logic.
        paid_sum = sum(p.amount for p in invoice.payments.all())
        invoice.paid_amount = paid_sum
        invoice.balance = invoice.total - invoice.paid_amount

        if invoice.balance <= 0:
            invoice.status = "PAID"
        elif invoice.paid_amount > 0:
            invoice.status = "PARTIAL"
        else:
            invoice.status = "DUE"

        invoice.save()

