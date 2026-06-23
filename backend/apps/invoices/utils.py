import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from django.conf import settings
import os

def generate_invoice_pdf(invoice):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle('Header', parent=styles['Heading1'], alignment=0, fontSize=20, fontName='Helvetica-Bold', spaceAfter=2)
    business_style = ParagraphStyle('Business', parent=styles['Normal'], fontSize=9, leading=12, textColor=colors.HexColor("#444444"))
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor("#666666"), fontName='Helvetica-Bold', uppercase=True)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=11, leading=14)
    status_style = ParagraphStyle('Status', parent=styles['Normal'], fontSize=12, fontName='Helvetica-Bold', alignment=2)
    
    elements = []
    
    # 1. Header (Logo and Business Details)
    org = invoice.organization
    
    left_header = []
    if org.logo:
        try:
            logo_path = org.logo.path
            if os.path.exists(logo_path):
                img = Image(logo_path, width=2.5*cm, height=2.5*cm, kind='proportional')
                img.hAlign = 'LEFT'
                left_header.append(img)
                left_header.append(Spacer(1, 0.2*cm))
        except Exception:
            pass
    
    left_header.append(Paragraph(org.name.upper(), header_style))
    left_header.append(Paragraph(org.email or "", business_style))
    left_header.append(Paragraph(org.phone or "", business_style))
    if org.vat_number:
        left_header.append(Paragraph(f"VAT No: {org.vat_number}", business_style))
    
    # Status colors
    status_color = colors.HexColor("#ef4444") # Red for DUE
    if invoice.status == "PAID":
        status_color = colors.HexColor("#22c55e") # Green
    elif invoice.status == "PARTIAL":
        status_color = colors.HexColor("#f59e0b") # Amber

    right_header = [
        Paragraph("INVOICE", ParagraphStyle('InvTitle', parent=styles['Heading1'], alignment=2, fontSize=28, textColor=colors.HexColor("#1e293b"), fontName='Helvetica-Bold')),
        Spacer(1, 0.2*cm),
        Paragraph(invoice.status.upper(), ParagraphStyle('StatusBox', parent=status_style, textColor=status_color)),
        Spacer(1, 0.5*cm),
        Paragraph(f"<b>Invoice #:</b> {invoice.invoice_number}", ParagraphStyle('InvNum', parent=styles['Normal'], alignment=2, fontSize=11)),
        Paragraph(f"<b>Date:</b> {invoice.date}", ParagraphStyle('InvDate', parent=styles['Normal'], alignment=2, fontSize=11)),
    ]
    
    header_table = Table([[left_header, right_header]], colWidths=[10*cm, 7*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 1*cm))
    
    # 2. Billing details section (Table for Customer vs Org address if needed, but horizontal is fine)
    cust = invoice.customer
    customer_info = [
        Paragraph("BILL TO", label_style),
        Spacer(1, 0.1*cm),
        Paragraph(f"<b>{cust.name}</b>", value_style),
        Paragraph(cust.address or "", value_style),
        Paragraph(f"Phone: {cust.phone or 'N/A'}", value_style),
        Paragraph(f"Email: {cust.email or 'N/A'}", value_style),
    ]
    if cust.vat_number:
        customer_info.append(Paragraph(f"VAT: {cust.vat_number}", value_style))
        
    elements.append(Table([[customer_info]], colWidths=[10*cm]))
    elements.append(Spacer(1, 0.8*cm))
    
    # 3. Items Table
    data = [['DESCRIPTION', 'QTY', 'RATE', 'TOTAL']]
    for item in invoice.items.all():
        data.append([
            Paragraph(item.description, styles['Normal']),
            str(item.quantity),
            f"{float(item.rate):,.2f}",
            f"{float(item.total):,.2f}"
        ])
    
    # Table layout
    t = Table(data, colWidths=[10*cm, 2*cm, 2.5*cm, 2.5*cm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.whitesmoke),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('ALIGN', (1,0), (-1,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor("#1e293b")),
        ('GRID', (0,1), (-1, -1), 0.1, colors.HexColor("#e2e8f0")),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 10),
        ('BOTTOMPADDING', (0,1), (-1,-1), 8),
        ('TOPPADDING', (0,1), (-1,-1), 8),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))
    
    # 4. Summary Table (Aligned Right)
    summary_data = [
        ['', 'Subtotal', f"{float(invoice.subtotal):,.2f}"],
        ['', 'VAT Amount', f"{float(invoice.vat_amount):,.2f}"],
        ['', Paragraph('<b>TOTAL</b>', styles['Normal']), Paragraph(f'<b>{float(invoice.total):,.2f}</b>', styles['Normal'])],
        ['', 'Paid to Date', f"{float(invoice.paid_amount):,.2f}"],
        ['', Paragraph('<b>BALANCE DUE</b>', status_style), Paragraph(f'<b>{float(invoice.balance):,.2f}</b>', status_style)],
    ]
    
    summary_table = Table(summary_data, colWidths=[11*cm, 3*cm, 3*cm])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
        ('FONTNAME', (2,-1), (2,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (1,-1), (2,-1), status_color),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LINEABOVE', (1,2), (2,2), 1, colors.black),
    ]))
    elements.append(summary_table)
    
    # 5. Footer
    elements.append(Spacer(1, 3*cm))
    footer_text = "Thank you for your business. Please contact us if you have any questions regarding this invoice."
    elements.append(Paragraph(footer_text, ParagraphStyle('Footer', parent=styles['Normal'], alignment=1, textColor=colors.grey, fontSize=9)))
    
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    return pdf
