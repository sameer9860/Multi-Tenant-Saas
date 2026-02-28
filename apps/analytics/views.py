from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from django.http import HttpResponse
from apps.invoices.models import Invoice
from crm.models import Expense
from apps.invoices.utils import generate_invoice_pdf # Reuse base PDF logic or create new one
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from apps.subscriptions.limits import PLAN_LIMITS

class UsageView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        if not org:
             return Response({"error": "Organization not found"}, status=404)
             
        plan = org.plan # Use org.plan if available or org.subscription.plan
        
        leads_count = org.leads.count()
        clients_count = org.clients.count()
        invoices_count = org.invoices.count()
        
        limits = PLAN_LIMITS.get(plan, {})
        
        # Determine invoice limits based on plan
        invoice_limit = None
        if plan == "FREE":
            invoice_limit = 10
        elif plan == "BASIC":
            invoice_limit = 1000
        # PRO and others have unlimited invoices (None)

        return Response({
            "plan": plan,
            "organization_name": org.name,
            "usage": {
                "leads": {
                    "used": leads_count,
                    "limit": limits.get("leads"),
                },
                "clients": {
                    "used": clients_count,
                    "limit": limits.get("clients"),
                },
                "invoices": {
                    "used": invoices_count,
                    "limit": invoice_limit,
                }
            },
            # Flat fields for simple dashboard summary
            "leads_count": leads_count,
            "clients_count": clients_count,
            "invoices_count": invoices_count,
            "subscription_plan": plan,
        })

class VATSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        now = timezone.now()
        
        # Monthly VAT Summary
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        export = request.query_params.get('export')
        
        invoices = Invoice.objects.filter(
            organization=org,
            date__month=month,
            date__year=year
        ).order_by('date', 'invoice_number')
        
        totals = invoices.aggregate(
            total_sales=Sum('subtotal'),
            total_vat=Sum('vat_amount'),
            grand_total=Sum('total')
        )

        data = {
            "month": month,
            "year": year,
            "total_sales": float(totals['total_sales'] or 0),
            "total_vat_collected": float(totals['total_vat'] or 0),
            "grand_total": float(totals['grand_total'] or 0),
            "invoice_count": invoices.count(),
            "invoices": [
                {
                    "invoice_number": inv.invoice_number,
                    "date": inv.date,
                    "customer_name": inv.customer.name,
                    "subtotal": float(inv.subtotal),
                    "vat_amount": float(inv.vat_amount),
                    "total": float(inv.total),
                } for inv in invoices
            ]
        }

        if export == 'csv':
            return self.export_csv(data)
        
        return Response(data)

    def export_csv(self, data):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        filename = f"VAT_Report_{data['month']}_{data['year']}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        # Header for the summary
        writer.writerow(['VAT Summary Report', f"{data['month']}/{data['year']}"])
        writer.writerow([])
        writer.writerow(['Summary Metrics'])
        writer.writerow(['Total Taxable Sales', f"Rs. {data['total_sales']:.2f}"])
        writer.writerow(['Total VAT Collected', f"Rs. {data['total_vat_collected']:.2f}"])
        writer.writerow(['Grand Total', f"Rs. {data['grand_total']:.2f}"])
        writer.writerow(['Total Invoices', data['invoice_count']])
        writer.writerow([])
        
        # Invoice Breakdown
        writer.writerow(['Invoice Breakdown'])
        writer.writerow(['Invoice #', 'Date', 'Customer', 'Subtotal', 'VAT', 'Total'])
        
        for inv in data['invoices']:
            writer.writerow([
                inv['invoice_number'],
                inv['date'],
                inv['customer_name'],
                f"{inv['subtotal']:.2f}",
                f"{inv['vat_amount']:.2f}",
                f"{inv['total']:.2f}"
            ])
            
        return response

class MonthlyReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.organization
        now = timezone.now()
        month = int(request.query_params.get('month', now.month))
        year = int(request.query_params.get('year', now.year))
        export = request.query_params.get('export')

        # Calculate Revenue (Paid/Total from Invoices)
        invoices = Invoice.objects.filter(organization=org, date__month=month, date__year=year)
        total_revenue = invoices.aggregate(Sum('total'))['total__sum'] or 0
        total_paid = invoices.aggregate(Sum('paid_amount'))['paid_amount__sum'] or 0
        total_vat = invoices.aggregate(Sum('vat_amount'))['vat_amount__sum'] or 0
        
        # Calculate Expenses
        expenses = Expense.objects.filter(organization=org, created_at__month=month, created_at__year=year)
        total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Profit
        net_profit = total_revenue - total_expenses
        
        report_data = {
            "month": month,
            "year": year,
            "revenue": float(total_revenue),
            "paid_revenue": float(total_paid),
            "expenses": float(total_expenses),
            "net_profit": float(net_profit),
            "vat_collected": float(total_vat),
            "invoice_count": invoices.count(),
            "customer_count": org.customers.count(),
        }

        if export == "pdf":
            return self.export_pdf(org, report_data)
        
        return Response(report_data)

    def export_pdf(self, org, data):
        # Using reportlab directly for specialized report
        import io
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []
        
        elements.append(Paragraph(f"{org.name} - Monthly Report", styles['Heading1']))
        elements.append(Paragraph(f"Period: {data['month']}/{data['year']}", styles['Normal']))
        elements.append(Spacer(1, 12))
        
        table_data = [
            ['Metric', 'Value'],
            ['Total Revenue', f"Rs. {data['revenue']:,.2f}"],
            ['Paid Revenue', f"Rs. {data['paid_revenue']:,.2f}"],
            ['Total Expenses', f"Rs. {data['expenses']:,.2f}"],
            ['Net Profit', f"Rs. {data['net_profit']:,.2f}"],
            ['VAT Collected', f"Rs. {data['vat_collected']:,.2f}"],
            ['Invoices Generated', str(data['invoice_count'])],
            ['Total Customers', str(data['customer_count'])],
        ]
        
        t = Table(table_data, colWidths=[8*cm, 6*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.grey),
            ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('GRID', (0,0), (-1,-1), 1, colors.black),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ]))
        elements.append(t)
        
        doc.build(elements)
        pdf = buffer.getvalue()
        buffer.close()
        
        response = HttpResponse(pdf, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Monthly_Report_{data["month"]}_{data["year"]}.pdf"'
        return response

@login_required
def usage_dashboard(request):
        return render(request, "analytics/usage.html")
