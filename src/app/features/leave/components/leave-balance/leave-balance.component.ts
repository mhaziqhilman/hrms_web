import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LeaveService } from '../../services/leave.service';
import { EmployeeService } from '../../../employees/services/employee.service';
import { Employee } from '../../../employees/models/employee.model';

// ZardUI Components
import { ZardCardComponent } from '@/shared/components/card/card.component';
import { ZardButtonComponent } from '@/shared/components/button/button.component';
import { ZardIconComponent } from '@/shared/components/icon/icon.component';
import { ZardBadgeComponent } from '@/shared/components/badge/badge.component';
import { ZardProgressBarComponent } from '@/shared/components/progress-bar/progress-bar.component';
import { ZardSelectComponent } from '@/shared/components/select/select.component';
import { ZardSelectItemComponent } from '@/shared/components/select/select-item.component';

@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardBadgeComponent,
    ZardProgressBarComponent,
    ZardSelectComponent,
    ZardSelectItemComponent
  ],
  templateUrl: './leave-balance.component.html',
  styleUrl: './leave-balance.component.css'
})
export class LeaveBalanceComponent implements OnInit {
  leaveBalance = signal<any>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  employees = signal<Employee[]>([]);
  selectedEmployeeId = signal<number | null>(null);
  selectedYear = signal<number>(new Date().getFullYear());

  years: number[] = [];

  constructor(
    private leaveService: LeaveService,
    private employeeService: EmployeeService
  ) {
    // Generate year options (current year and 2 previous years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.employeeService.getEmployees({ status: 'Active', limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.employees.set(response.data.employees);

          // Auto-select first employee
          if (response.data.employees.length > 0) {
            this.selectedEmployeeId.set(response.data.employees[0].id);
            this.loadLeaveBalance();
          }
        }
      },
      error: (err) => {
        this.error.set('Failed to load employees');
        console.error('Error loading employees:', err);
      }
    });
  }

  loadLeaveBalance(): void {
    const employeeId = this.selectedEmployeeId();
    const year = this.selectedYear();

    if (!employeeId) return;

    this.loading.set(true);
    this.error.set(null);

    this.leaveService.getLeaveBalance(employeeId, year).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaveBalance.set(response.data);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load leave balance');
        this.loading.set(false);
        console.error('Error loading leave balance:', err);
      }
    });
  }

  onEmployeeChange(): void {
    this.loadLeaveBalance();
  }

  onYearChange(): void {
    this.loadLeaveBalance();
  }

  getProgressPercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  }

  getProgressColor(percentage: number): 'default' | 'destructive' | 'accent' {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'accent';
    return 'default';
  }
}
