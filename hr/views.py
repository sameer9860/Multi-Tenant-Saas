from rest_framework import viewsets, pagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import models
from django.http import StreamingHttpResponse, HttpResponse
import csv
import io
from datetime import datetime, timedelta
from .models import Employee, Department, Designation, Attendance, LeaveRequest, Payroll
from .serializers import (
    EmployeeSerializer, DepartmentSerializer, 
    DesignationSerializer, AttendanceSerializer, LeaveRequestSerializer, PayrollSerializer
)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Attendance.objects.filter(organization=org)
        return self.filter_queryset_by_params(queryset).order_by('-date', 'employee__full_name')

    def filter_queryset_by_params(self, queryset):
        # Filters
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)

        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(employee__department_id=department)

        designation = self.request.query_params.get('designation')
        if designation:
            queryset = queryset.filter(employee__designation_id=designation)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(employee__full_name__icontains=search)

        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)

        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)

    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        
        records = request.data.get('records', [])
        date = request.data.get('date')
        
        if not date or not records:
            return Response(
                {"error": "Date and records are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        created_count = 0
        updated_count = 0
        
        for record in records:
            employee_id = record.get('employee')
            status_val = record.get('status')
            notes = record.get('notes', '')
            
            attendance, created = Attendance.objects.update_or_create(
                organization=org,
                employee_id=employee_id,
                date=date,
                defaults={
                    'status': status_val,
                    'notes': notes
                }
            )
            
            if created:
                created_count += 1
            else:
                updated_count += 1
                
        return Response({
            "message": f"Successfully processed {len(records)} records.",
            "created": created_count,
            "updated": updated_count
        })

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            # Normalize headers (lowercase and strip spaces)
            # This handles things like "Employee Name" vs "employee name"
            headers = [h.strip().lower() for h in reader.fieldnames]
            
            success_count = 0
            errors = []
            
            # Map required columns
            # Expected: employee name, date, status
            # Optional: notes
            
            for row_idx, row in enumerate(reader, start=2): # Header is line 1
                try:
                    # Clean the row keys
                    clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                    
                    emp_name = clean_row.get('employee name') or clean_row.get('name') or clean_row.get('employee')
                    date_str = clean_row.get('date')
                    status_str = clean_row.get('status', 'PRESENT').upper()
                    notes = clean_row.get('notes', '')
                    
                    if not emp_name or not date_str:
                        errors.append(f"Row {row_idx}: Missing employee name or date.")
                        continue
                        
                    # Find employee
                    employees = Employee.objects.filter(organization=org, full_name__iexact=emp_name)
                    if not employees.exists():
                        errors.append(f"Row {row_idx}: Employee '{emp_name}' not found.")
                        continue
                    if employees.count() > 1:
                        errors.append(f"Row {row_idx}: Multiple employees found with name '{emp_name}'.")
                        continue
                        
                    employee = employees.first()
                    
                    # Parse date - handle common formats
                    try:
                        # ISO format YYYY-MM-DD
                        parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            # DD/MM/YYYY
                            parsed_date = datetime.strptime(date_str, '%d/%m/%Y').date()
                        except ValueError:
                            errors.append(f"Row {row_idx}: Invalid date format '{date_str}'. Use YYYY-MM-DD.")
                            continue
                            
                    # Validate Status
                    valid_statuses = [choice[0] for choice in Attendance.STATUS_CHOICES]
                    if status_str not in valid_statuses:
                        # Try to map common variations
                        if status_str == 'P': status_str = 'PRESENT'
                        elif status_str == 'A': status_str = 'ABSENT'
                        elif status_str == 'L': status_str = 'LEAVE'
                        elif status_str == 'H': status_str = 'HALF_DAY'
                        else:
                            errors.append(f"Row {row_idx}: Invalid status '{status_str}'. Valid statuses: {', '.join(valid_statuses)}")
                            continue
                    
                    # Create or update
                    Attendance.objects.update_or_create(
                        organization=org,
                        employee=employee,
                        date=parsed_date,
                        defaults={
                            'status': status_str,
                            'notes': notes
                        }
                    )
                    success_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {row_idx}: Error processing - {str(e)}")
                    
            return Response({
                "message": f"Import completed. {success_count} records processed successfully.",
                "success_count": success_count,
                "error_count": len(errors),
                "errors": errors
            })
            
        except Exception as e:
            return Response({"error": f"Failed to process CSV file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        queryset = Attendance.objects.filter(organization=org).select_related('employee')
        queryset = self.filter_queryset_by_params(queryset).order_by('-date', 'employee__full_name')
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['S.N', 'Date', 'Employee Name', 'Status', 'Notes'])
        
        # Write data
        for idx, item in enumerate(queryset, 1):
            writer.writerow([
                idx,
                item.date.strftime('%Y-%m-%d'),
                item.employee.full_name,
                item.status,
                item.notes or ''
            ])
            
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_history_{datetime.now().strftime("%Y-%m-%d")}.csv"'
        return response



class EmployeePagination(pagination.PageNumberPagination):
    page_size = 25

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get('no_pagination') == 'true':
            return None
        return super().paginate_queryset(queryset, request, view)


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Department.objects.filter(organization=org).annotate(
            employee_count=models.Count('employees')
        )
        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)


class DesignationViewSet(viewsets.ModelViewSet):
    serializer_class = DesignationSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Designation.objects.filter(organization=org).annotate(
            employee_count=models.Count('employees')
        )
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)
            
        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)


class EmployeeViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeeSerializer
    pagination_class = EmployeePagination
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Employee.objects.filter(organization=org)

        # Status filter
        status = self.request.query_params.get('status')
        if status and status != 'ALL':
            queryset = queryset.filter(status=status)

        # Department filter
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department_id=department)

        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(full_name__icontains=search)
                | models.Q(email__icontains=search)
                | models.Q(phone__icontains=search)
                | models.Q(department__name__icontains=search)
                | models.Q(designation__name__icontains=search)
            )

        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    pagination_class = None
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = LeaveRequest.objects.filter(organization=org).select_related('employee', 'approved_by')
        return self.filter_queryset_by_params(queryset).order_by('-created_at')

    def filter_queryset_by_params(self, queryset):
        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)
            
        status = self.request.query_params.get('status')
        if status and status != 'ALL':
            queryset = queryset.filter(status=status)

        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(employee__department_id=department)

        designation = self.request.query_params.get('designation')
        if designation:
            queryset = queryset.filter(employee__designation_id=designation)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(employee__full_name__icontains=search)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(start_date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(end_date__lte=end_date)
            
        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)

    def perform_update(self, serializer):
        instance = self.get_object()
        old_status = instance.status
        new_status = serializer.validated_data.get('status', old_status)
        
        # Set approved_by if status changed to APPROVED
        if old_status != 'APPROVED' and new_status == 'APPROVED':
            serializer.validated_data['approved_by'] = self.request.user
            
        updated_instance = serializer.save()
        
        # Bonus: Auto-mark attendance as Leave when approved
        if old_status != 'APPROVED' and new_status == 'APPROVED':
            self.create_attendance_for_leave(updated_instance)

    def create_attendance_for_leave(self, leave_request):
        current_date = leave_request.start_date
        end_date = leave_request.end_date
        
        while current_date <= end_date:
            Attendance.objects.update_or_create(
                organization=leave_request.organization,
                employee=leave_request.employee,
                date=current_date,
                defaults={
                    'status': 'LEAVE',
                    'notes': f"Auto-marked from approved {leave_request.leave_type} leave request."
                }
            )
            current_date += timedelta(days=1)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        queryset = LeaveRequest.objects.filter(organization=org).select_related('employee', 'approved_by')
        queryset = self.filter_queryset_by_params(queryset).order_by('-created_at')
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['S.N', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Status', 'Reason', 'Approved By'])
        
        # Write data
        for idx, item in enumerate(queryset, 1):
            writer.writerow([
                idx,
                item.employee.full_name,
                item.get_leave_type_display(),
                item.start_date.strftime('%Y-%m-%d'),
                item.end_date.strftime('%Y-%m-%d'),
                item.status,
                item.reason or '',
                item.approved_by.full_name if item.approved_by else '—'
            ])
        
        response = HttpResponse(output.getvalue(), content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="leave_requests_{datetime.now().strftime("%Y-%m-%d")}.csv"'
        return response

class PayrollViewSet(viewsets.ModelViewSet):
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]

    def get_org(self):
        return (
            getattr(self.request, 'organization', None)
            or getattr(self.request.user, 'organization', None)
        )

    def get_queryset(self):
        org = self.get_org()
        queryset = Payroll.objects.filter(organization=org).select_related('employee')
        return self.filter_queryset_by_params(queryset).order_by('-month', 'employee__full_name')

    def filter_queryset_by_params(self, queryset):
        employee = self.request.query_params.get('employee')
        if employee:
            queryset = queryset.filter(employee_id=employee)
            
        status = self.request.query_params.get('status')
        if status and status != 'ALL':
            queryset = queryset.filter(status=status)

        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            try:
                date_filter = datetime(int(year), int(month), 1).date()
                queryset = queryset.filter(month=date_filter)
            except ValueError:
                pass

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(employee__full_name__icontains=search)
            
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(employee__department_id=department)

        return queryset

    def perform_create(self, serializer):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
        serializer.save(organization=org)
        
    @action(detail=False, methods=['post'])
    def generate_payroll(self, request):
        org = self.get_org()
        if not org:
            raise PermissionDenied("User is not associated with an organization.")
            
        month_str = request.data.get('month')
        year_str = request.data.get('year')
        
        if not month_str or not year_str:
            return Response(
                {"error": "Month and year are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            target_month = datetime(int(year_str), int(month_str), 1).date()
            if int(month_str) == 12:
                next_month = datetime(int(year_str) + 1, 1, 1).date()
            else:
                next_month = datetime(int(year_str), int(month_str) + 1, 1).date()
        except ValueError:
             return Response(
                {"error": "Invalid month or year."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        employees = Employee.objects.filter(organization=org, status='ACTIVE')
        
        generated_count = 0
        updated_count = 0
        
        for employee in employees:
            # Get attendance for the month
            attendances = Attendance.objects.filter(
                organization=org,
                employee=employee,
                date__gte=target_month,
                date__lt=next_month
            )
            
            present_days = attendances.filter(status='PRESENT').count()
            absent_days = attendances.filter(status='ABSENT').count()
            leave_days = attendances.filter(status='LEAVE').count()
            half_days = attendances.filter(status='HALF_DAY').count()
            
            # Create or update draft payroll
            payroll, created = Payroll.objects.get_or_create(
                organization=org,
                employee=employee,
                month=target_month,
                defaults={
                    'basic_salary': employee.basic_salary,
                    'working_days': 30, # Defaulting to 30 for monthly calculation, could be dynamic
                    'present_days': present_days,
                    'absent_days': absent_days,
                    'leave_days': leave_days,
                    'half_days': half_days,
                }
            )
            
            if not created and payroll.status == 'DRAFT':
                # Update if only DRAFT, don't overwrite user adjustments unless fully recalculating
                payroll.basic_salary = employee.basic_salary
                payroll.present_days = present_days
                payroll.absent_days = absent_days
                payroll.leave_days = leave_days
                payroll.half_days = half_days
                payroll.save() # calculates net_salary
                updated_count += 1
            elif created:
                # Save just to trigger calculate_net_salary in model
                payroll.save()
                generated_count += 1
                
        return Response({
            "message": f"Successfully generated {generated_count} new payrolls and updated {updated_count} drafts.",
            "generated": generated_count,
            "updated": updated_count
        })
