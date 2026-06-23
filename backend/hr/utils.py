import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_payslip_pdf(payroll):
    """
    Generates a PDF payslip for a given Payroll record.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    title_style.alignment = 1 # Center
    
    subtitle_style = styles['Heading2']
    subtitle_style.alignment = 1 # Center
    
    normal_style = styles['Normal']
    
    # 1. Organization & Header
    elements.append(Paragraph(payroll.organization.name, title_style))
    elements.append(Paragraph(f"Payslip for {payroll.month.strftime('%B %Y')}", subtitle_style))
    elements.append(Spacer(1, 0.25 * inch))
    
    # 2. Employee Details Table
    employee_data = [
        ['Employee Name:', payroll.employee.full_name, 'Department:', payroll.employee.department.name if payroll.employee.department else 'N/A'],
        ['Designation:', payroll.employee.designation.name if payroll.employee.designation else 'N/A', 'Month:', payroll.month.strftime('%B %Y')],
    ]
    
    emp_table = Table(employee_data, colWidths=[1.5*inch, 2*inch, 1.2*inch, 2*inch])
    emp_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(emp_table)
    elements.append(Spacer(1, 0.3 * inch))
    
    # 3. Earnings & Deductions Tables
    data = [
        ['Description', 'Earnings', 'Description', 'Deductions'],
        ['Basic Salary', f"{payroll.basic_salary:,.2f}", 'Absence Deduction', f"{payroll.absence_deduction:,.2f}"],
        ['Allowances', f"{payroll.allowances:,.2f}", 'Advance Deduction', f"{payroll.advance_deduction:,.2f}"],
        ['', '', 'Other Deductions', f"{payroll.deductions:,.2f}"],
        ['Total Gross', f"{(float(payroll.basic_salary) + float(payroll.allowances)):,.2f}", 'Total Deductions', f"{(float(payroll.absence_deduction) + float(payroll.advance_deduction) + float(payroll.deductions)):,.2f}"],
    ]
    
    main_table = Table(data, colWidths=[1.8*inch, 1.5*inch, 1.8*inch, 1.5*inch])
    main_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('FONTNAME', (0, 4), (-1, 4), 'Helvetica-Bold'),
    ]))
    elements.append(main_table)
    elements.append(Spacer(1, 0.4 * inch))
    
    # 4. Net Payable
    net_style = ParagraphStyle('NetStyle', parent=normal_style, fontSize=12, leading=14, fontName='Helvetica-Bold')
    elements.append(Paragraph(f"Net Payable: {payroll.net_salary:,.2f}", net_style))
    elements.append(Spacer(1, 0.1 * inch))
    # Add words representation if needed, but let's keep it simple for now.
    
    elements.append(Spacer(1, 0.8 * inch))
    
    # 5. Signatures
    sig_data = [
        ['__________________________', '__________________________'],
        ['Employer Signature', 'Employee Signature']
    ]
    sig_table = Table(sig_data, colWidths=[3.3*inch, 3.3*inch])
    sig_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Oblique'),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
    ]))
    elements.append(sig_table)
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
