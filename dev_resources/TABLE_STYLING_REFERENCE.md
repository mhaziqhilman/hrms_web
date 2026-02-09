# Table Styling & Functionality Reference Guide

This document outlines all the improvements and styling applied to the Payroll List table component. Use this as a reference when applying similar functionality to other list pages.

---

## Table of Contents
1. [Status Tabs with Counts](#1-status-tabs-with-counts)
2. [Filter Section](#2-filter-section)
3. [Bulk Actions Bar](#3-bulk-actions-bar)
4. [Column Sorting](#4-column-sorting)
5. [Fixed Row Height with No Text Wrap](#5-fixed-row-height-with-no-text-wrap)
6. [Horizontal Scrolling](#6-horizontal-scrolling)
7. [Vertical Centering](#7-vertical-centering)
8. [Alert Dialog Integration](#8-alert-dialog-integration)
9. [Complete Code Examples](#9-complete-code-examples)

---

## 1. Status Tabs with Counts

### Features
- Horizontal tabs with status badges
- Active tab highlighting
- Status count badges
- Horizontal scrolling for mobile
- Icon + Text labels

### TypeScript Implementation

#### 1.1 Add Tab State and Counts
```typescript
// Tab state
activeTab = signal<string>('All');

// Status counts
statusCounts = signal<{[key: string]: number}>({
  'All': 0,
  'Draft': 0,
  'Pending': 0,
  'Approved': 0,
  'Paid': 0,
  'Cancelled': 0
});

// Tab change handler
onTabChange(tab: {index: number, label: string}): void {
  const statusMap: {[key: string]: string} = {
    'All Request': 'All',
    'Draft': PayrollStatus.DRAFT,
    'Pending Approval': PayrollStatus.PENDING,
    'Approved': PayrollStatus.APPROVED,
    'Paid': PayrollStatus.PAID,
    'Cancelled': PayrollStatus.CANCELLED
  };

  this.activeTab.set(statusMap[tab.label] || 'All');
  this.loadData();
}

// Calculate status counts
calculateStatusCounts(): void {
  const counts: {[key: string]: number} = {
    'All': this.allData.length,
    'Draft': 0,
    'Pending': 0,
    'Approved': 0,
    'Paid': 0,
    'Cancelled': 0
  };

  this.allData.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status]++;
    }
  });

  this.statusCounts.set(counts);
}
```

### HTML Template Implementation

#### 1.2 Status Tabs
```html
<!-- Status Tabs -->
<div class="mb-6">
  <div class="border-b border-border">
    <nav class="flex gap-1 overflow-auto scroll nav-tab-scroll -mb-px" aria-label="Tabs" role="tablist">
      <!-- All Tab -->
      <button
        type="button"
        role="tab"
        (click)="onTabChange({index: 0, label: 'All Request'})"
        [attr.aria-selected]="activeTab() === 'All'"
        [class]="activeTab() === 'All'
          ? 'border-b-2 border-b-primary text-primary text-sm'
          : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground text-sm'"
        class="hover:bg-transparent rounded-none flex-shrink-0 whitespace-nowrap py-2 px-2 font-medium text-sm transition-colors flex items-center gap-2">
        <z-icon zType="layers" class="w-4 h-4" />
        All Request
        <span
          [class]="activeTab() === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
          class="ml-1 py-0.5 px-2.5 rounded-full text-xs font-semibold min-w-[28px] text-center">
          {{ statusCounts()['All'] }}
        </span>
      </button>

      <!-- Draft Tab -->
      <button
        type="button"
        role="tab"
        (click)="onTabChange({index: 1, label: 'Draft'})"
        [attr.aria-selected]="activeTab() === 'Draft'"
        [class]="activeTab() === 'Draft'
          ? 'border-b-2 border-b-primary text-primary'
          : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'"
        class="hover:bg-transparent rounded-none flex-shrink-0 whitespace-nowrap py-2 px-2 font-medium text-sm transition-colors flex items-center gap-2">
        <z-icon zType="file-text" class="w-4 h-4" />
        Draft
        <span
          [class]="activeTab() === 'Draft' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'"
          class="ml-1 py-0.5 px-2.5 rounded-full text-xs font-semibold min-w-[28px] text-center">
          {{ statusCounts()['Draft'] }}
        </span>
      </button>

      <!-- Add more tabs as needed -->
    </nav>
  </div>
</div>
```

### CSS Implementation

#### 1.3 Tab Scrollbar Styling
```css
/* Tab navigation scrollbar styling */
.nav-tab-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.nav-tab-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(209, 209, 209, 0.2);
  border-radius: 2px;
}

.nav-tab-scroll::-webkit-scrollbar {
  height: 4px;
  width: 4px;
}

.nav-tab-scroll::-webkit-scrollbar-button {
  display: none;
}
```

---

## 2. Filter Section

### Features
- Search input with icon
- Dropdown filters with active state indicators
- "Reset" button to clear all filters
- Visual differentiation for active filters (solid border + background)
- Column visibility toggle

### TypeScript Implementation

#### 2.1 Add Filter State Signals
```typescript
// Filter state
searchEmployeeId = signal<string>('');
selectedStatus = signal<string>('');
selectedYear = signal<number | null>(null);
selectedMonth = signal<number | string>('');

// Available filter options
years: number[] = [2024, 2023, 2022, 2021, 2020];
MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Column visibility
visibleColumns = signal<{[key: string]: boolean}>({
  employee: true,
  period: true,
  basicSalary: true,
  grossSalary: true,
  deductions: true,
  netSalary: true,
  status: true
});
```

#### 2.2 Implement Filter Methods
```typescript
// Filter change handler
onFilterChange(): void {
  this.currentPage.set(1); // Reset to first page
  this.loadData();
}

// Clear all filters
clearFilters(): void {
  this.searchEmployeeId.set('');
  this.selectedStatus.set('');
  this.selectedYear.set(null);
  this.selectedMonth.set('');
  this.onFilterChange();
}

// Get month name for display
getSelectedMonthName(): string {
  if (!this.selectedMonth()) return 'Month';
  return this.MONTH_NAMES[Number(this.selectedMonth()) - 1];
}

// Toggle column visibility
toggleColumn(column: string): void {
  const current = this.visibleColumns();
  this.visibleColumns.set({
    ...current,
    [column]: !current[column]
  });
}
```

### HTML Template Implementation

#### 2.3 Filter Section
```html
<!-- Filters -->
<div class="flex items-center gap-3 mb-6 flex-wrap justify-between">
  <div class="flex items-center gap-3 flex-1 flex-wrap">
    <!-- Search Bar -->
    <div class="relative flex-1 min-w-[180px] max-w-md">
      <z-icon zType="search" class="absolute left-1.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        [ngModel]="searchEmployeeId()"
        (ngModelChange)="searchEmployeeId.set($event); onFilterChange()"
        placeholder="Search by employee name or ID..."
        class="w-full pl-8 pr-2 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />
    </div>

    <!-- Status Filter -->
    <div z-menu [zMenuTriggerFor]="statusMenu">
      <button
        z-button
        zType="outline"
        [class]="selectedStatus()
          ? 'gap-2 border border-solid px-2 bg-primary/5 text-primary border-primary'
          : 'gap-2 border border-dashed px-2'">
        <z-icon [zType]="selectedStatus() ? 'circle-check' : 'circle-plus'" class="w-4 h-4" />
        {{ selectedStatus() ? selectedStatus() : 'Status' }}
      </button>
    </div>
    <ng-template #statusMenu>
      <div z-menu-content class="w-48">
        <button type="button" z-menu-item (click)="selectedStatus.set(''); onFilterChange()">
          All Status
        </button>
        <button type="button" z-menu-item (click)="selectedStatus.set('Draft'); onFilterChange()">
          Draft
        </button>
        <button type="button" z-menu-item (click)="selectedStatus.set('Pending'); onFilterChange()">
          Pending
        </button>
        <button type="button" z-menu-item (click)="selectedStatus.set('Approved'); onFilterChange()">
          Approved
        </button>
      </div>
    </ng-template>

    <!-- Year Filter -->
    <div z-menu [zMenuTriggerFor]="yearMenu">
      <button
        z-button
        zType="outline"
        [class]="selectedYear()
          ? 'gap-2 border border-solid px-2 bg-primary/5 text-primary border-primary'
          : 'gap-2 border border-dashed px-2'"
      >
        <z-icon [zType]="selectedYear() ? 'circle-check' : 'circle-plus'" class="w-4 h-4" />
        {{ selectedYear() ?? 'Year' }}
      </button>
    </div>
    <ng-template #yearMenu>
      <div z-menu-content class="w-48">
        <button type="button" z-menu-item (click)="selectedYear.set(null); onFilterChange()">
          All Years
        </button>
        @for (year of years; track year) {
          <button type="button" z-menu-item (click)="selectedYear.set(year); onFilterChange()">
            {{ year }}
          </button>
        }
      </div>
    </ng-template>

    <!-- Month Filter -->
    <div z-menu [zMenuTriggerFor]="monthMenu">
      <button
        z-button
        zType="outline"
        [class]="selectedMonth()
          ? 'gap-2 border border-solid px-2 bg-primary/5 text-primary border-primary'
          : 'gap-2 border border-dashed px-2'">
        <z-icon [zType]="selectedMonth() ? 'circle-check' : 'circle-plus'" class="w-4 h-4" />
        {{ getSelectedMonthName() }}
      </button>
    </div>
    <ng-template #monthMenu>
      <div z-menu-content class="w-48">
        <button type="button" z-menu-item (click)="selectedMonth.set(''); onFilterChange()">
          All Months
        </button>
        @for (month of MONTH_NAMES; track month; let i = $index) {
          <button type="button" z-menu-item (click)="selectedMonth.set(i + 1); onFilterChange()">
            {{ month }}
          </button>
        }
      </div>
    </ng-template>

    <!-- Clear Filters -->
    <button
      *ngIf="selectedStatus() || selectedYear() || selectedMonth() || searchEmployeeId()"
      type="button"
      z-button
      zType="outline"
      class="gap-2 border-none shadow-none px-2"
      (click)="clearFilters()">
      Reset
      <z-icon zType="x" class="w-4 h-4" />
    </button>
  </div>

  <!-- Column Toggle - Right Side -->
  <div z-menu [zMenuTriggerFor]="columnMenu">
    <button z-button zType="outline" class="gap-2 px-2">
      <z-icon zType="eye" class="w-4 h-4" />
      View
    </button>
  </div>
  <ng-template #columnMenu>
    <div z-menu-content class="w-56">
      <div class="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        Toggle Columns
      </div>
      @for (column of columnList; track column.key) {
        <button type="button" z-menu-item (click)="toggleColumn(column.key)" class="justify-between">
          {{ column.label }}
          <z-icon
            [zType]="visibleColumns()[column.key] ? 'check' : ''"
            class="w-4 h-4"
            [class.opacity-0]="!visibleColumns()[column.key]" />
        </button>
      }
    </div>
  </ng-template>
</div>
```

### Key Filter Features

1. **Search Input**:
   - Icon positioned inside input (left side)
   - Placeholder text for guidance
   - Real-time filtering on input change

2. **Dropdown Filters**:
   - **Inactive state**: Dashed border, `circle-plus` icon, placeholder text
   - **Active state**: Solid border, primary color background/text, `circle-check` icon, selected value
   - Classes: `border border-dashed` (inactive) vs `border border-solid bg-primary/5 text-primary border-primary` (active)

3. **Reset Button**:
   - Only shows when filters are active
   - Border-less, shadow-less style
   - X icon with "Reset" text

4. **Column Toggle**:
   - Eye icon
   - Checkmarks for visible columns
   - Positioned on the right side

---

## 3. Bulk Actions Bar

### Features
- Modern gradient background with border accent
- Shows count of selected items
- Action buttons (Approve, Delete, etc.)
- Clear selection button
- Only visible when items are selected

### TypeScript Implementation

#### 3.1 Add Selection Methods
```typescript
// Get selected count
getSelectedCount(): number {
  return this.selectedItems().size;
}

// Clear selection
clearSelection(): void {
  this.selectedItems.set(new Set());
  this.selectAll.set(false);
}

// Bulk actions
bulkApprove(): void {
  const selected = Array.from(this.selectedItems());
  if (selected.length === 0) {
    this.alertDialogService.warning({
      zTitle: 'No Selection',
      zDescription: 'Please select items to approve',
      zOkText: 'OK'
    });
    return;
  }

  this.alertDialogService.confirm({
    zTitle: 'Approve Selected Items',
    zDescription: `Are you sure you want to approve ${selected.length} item(s)?`,
    zOkText: 'Approve All',
    zCancelText: 'Cancel',
    zOnOk: () => {
      // Implement bulk approve logic
      this.clearSelection();
      this.loadData();
    }
  });
}

bulkDelete(): void {
  const selected = Array.from(this.selectedItems());
  if (selected.length === 0) {
    this.alertDialogService.warning({
      zTitle: 'No Selection',
      zDescription: 'Please select items to delete',
      zOkText: 'OK'
    });
    return;
  }

  this.alertDialogService.confirm({
    zTitle: 'Delete Selected Items',
    zDescription: `Are you sure you want to delete ${selected.length} item(s)? This action cannot be undone.`,
    zOkText: 'Delete All',
    zCancelText: 'Cancel',
    zOkDestructive: true,
    zOnOk: () => {
      // Implement bulk delete logic
      this.clearSelection();
      this.loadData();
    }
  });
}
```

### HTML Template Implementation

#### 3.2 Bulk Actions Bar
```html
<!-- Bulk Actions Bar - Modern SaaS Style -->
<div *ngIf="getSelectedCount() > 0"
  class="mb-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm border-l-4 border-primary shadow-sm">
  <div class="flex items-center justify-between px-6 py-3 gap-4">
    <!-- Left: Selection Info -->
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
        <z-icon zType="check-circle" class="w-4 h-4 text-primary" />
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-semibold text-foreground">{{ getSelectedCount() }} Selected</span>
        <span class="text-xs text-muted-foreground">Bulk actions available</span>
      </div>
    </div>

    <!-- Right: Action Buttons -->
    <div class="flex items-center gap-2">
      <button type="button" (click)="bulkApprove()"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-all duration-200 shadow-sm hover:shadow-md">
        <z-icon zType="circle-check" class="w-4 h-4" />
        <span>Approve</span>
      </button>
      <button type="button" (click)="bulkDelete()"
        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-md transition-all duration-200 shadow-sm hover:shadow-md">
        <z-icon zType="trash" class="w-4 h-4" />
        <span>Delete</span>
      </button>
      <div class="w-px h-6 bg-border mx-1"></div>
      <button type="button" (click)="clearSelection()"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200">
        <z-icon zType="x" class="w-4 h-4" />
        <span>Clear</span>
      </button>
    </div>
  </div>
</div>
```

---

## 4. Column Sorting

### Features
- Click column headers to sort
- Toggle between ascending/descending order
- Visual indicators (up/down arrows)
- Active column highlighting

### TypeScript Implementation

#### 4.1 Add Sorting State Signals
```typescript
// Sorting
sortColumn = signal<string>('');
sortDirection = signal<'asc' | 'desc'>('asc');
```

#### 4.2 Implement Sorting Methods
```typescript
// Sorting methods
onSort(column: string): void {
  if (this.sortColumn() === column) {
    // Toggle direction if same column
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  } else {
    // Set new column and default to ascending
    this.sortColumn.set(column);
    this.sortDirection.set('asc');
  }
  this.sortPayrolls();
}

sortPayrolls(): void {
  const column = this.sortColumn();
  const direction = this.sortDirection();

  if (!column) return;

  const sorted = [...this.payrolls()].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (column) {
      case 'employee':
        aValue = a.employee?.full_name?.toLowerCase() || '';
        bValue = b.employee?.full_name?.toLowerCase() || '';
        break;
      case 'period':
        aValue = a.year * 12 + a.month;
        bValue = b.year * 12 + b.month;
        break;
      case 'basicSalary':
        aValue = parseFloat(a.basic_salary?.toString() || '0');
        bValue = parseFloat(b.basic_salary?.toString() || '0');
        break;
      case 'grossSalary':
        aValue = parseFloat(a.gross_salary?.toString() || '0');
        bValue = parseFloat(b.gross_salary?.toString() || '0');
        break;
      case 'deductions':
        aValue = parseFloat(a.total_deductions?.toString() || '0');
        bValue = parseFloat(b.total_deductions?.toString() || '0');
        break;
      case 'netSalary':
        aValue = parseFloat(a.net_salary?.toString() || '0');
        bValue = parseFloat(b.net_salary?.toString() || '0');
        break;
      case 'status':
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  this.payrolls.set(sorted);
}

getSortIcon(column: string): 'chevrons-up-down' | 'chevron-up' | 'chevron-down' {
  if (this.sortColumn() !== column) return 'chevrons-up-down';
  return this.sortDirection() === 'asc' ? 'chevron-up' : 'chevron-down';
}

isSortActive(column: string): boolean {
  return this.sortColumn() === column;
}
```

### HTML Template Implementation

#### 4.3 Update Column Headers
```html
<th>
  <button
    (click)="onSort('employee')"
    class="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
    [class.text-primary]="isSortActive('employee')">
    <span>Employee</span>
    <z-icon [zType]="getSortIcon('employee')" class="w-4 h-4" />
  </button>
</th>
```

**Key Points:**
- Remove icon before column name (only keep sort indicator)
- Use button wrapper for clickable headers
- Apply hover and active states
- Sort icon changes based on direction

---

## 5. Fixed Row Height with No Text Wrap

### Features
- Consistent row height (60px)
- Text doesn't wrap to new lines
- Overflow text shows ellipsis (...)
- Prevents layout shifts

### CSS Implementation

#### 5.1 Fixed Row Height
```css
.payroll-table tbody tr {
  height: 60px;
}
```

#### 5.2 No Text Wrap with Ellipsis
```css
.payroll-table th,
.payroll-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### HTML Implementation

#### 5.3 Actions Column - Prevent Wrapping
```html
<td class="!pr-3 text-right">
  <div class="flex gap-2 flex-nowrap">
    <!-- Action buttons here -->
  </div>
</td>
```

**Key Point:** Use `flex-nowrap` instead of `flex-wrap` to prevent buttons from wrapping to new lines.

---

## 6. Horizontal Scrolling

### Features
- Table scrolls horizontally when content exceeds viewport
- Custom styled scrollbar
- Smooth scrolling experience
- Maintains all content accessibility

### CSS Implementation

#### 6.1 Container with Horizontal Scroll
```css
.payroll-table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.payroll-table-container::-webkit-scrollbar {
  height: 8px;
}

.payroll-table-container::-webkit-scrollbar-thumb {
  background-color: rgba(209, 209, 209, 0.5);
  border-radius: 4px;
}

.payroll-table-container::-webkit-scrollbar-track {
  background-color: rgba(209, 209, 209, 0.1);
}
```

### HTML Implementation

#### 6.2 Apply Container Class
```html
<div class="payroll-table-container rounded-lg border" *ngIf="payrolls().length > 0">
  <table z-table class="payroll-table">
    <!-- Table content -->
  </table>
</div>
```

---

## 7. Vertical Centering & ZardUI Checkboxes

### Features
- All content vertically centered in cells
- **ZardUI Checkboxes** with custom styling
- Checkboxes aligned properly
- Consistent appearance across all columns
- Custom checkmark icon with smooth animations

### TypeScript Implementation

#### 7.1 Import ZardUI Checkbox Component
```typescript
import { ZardCheckboxComponent } from '@/shared/components/checkbox/checkbox.component';

@Component({
  selector: 'app-your-list',
  standalone: true,
  imports: [
    CommonModule,
    // ... other imports
    ZardCheckboxComponent  // Add this
  ],
  // ...
})
```

### CSS Implementation

#### 7.2 Vertical Alignment
```css
.payroll-table th,
.payroll-table td {
  vertical-align: middle;
}
```

#### 7.3 Center Checkbox Column Header
```css
.payroll-table th.th-text-center {
  text-align: center !important;
}
```

#### 7.4 Fix ZardUI Checkbox in Tables (IMPORTANT)
**Note:** ZardUI checkbox uses a `<main>` element internally. If your main layout CSS has global `<main>` styling, you need to scope it to prevent conflicts.

In your `main-layout.component.css`, change:
```css
/* Before (incorrect - affects all <main> elements) */
:host ::ng-deep z-content main {
  display: flex !important;
  /* ... other styles */
}

/* After (correct - only direct children of z-content) */
:host ::ng-deep z-content > main {
  display: flex !important;
  /* ... other styles */
}
```

The `>` child combinator ensures styles only apply to direct children, not nested elements in checkboxes.

### HTML Implementation

#### 7.5 Checkbox Header with ZardUI
```html
<th class="!pl-3 w-10 th-text-center">
  <span z-checkbox [(ngModel)]="selectAll" (ngModelChange)="toggleSelectAll()"></span>
</th>
```

#### 7.6 Checkbox Body Cell with ZardUI
```html
<td class="!pl-3 text-center">
  <span z-checkbox
    [ngModel]="isPayrollSelected(payroll.id)"
    (ngModelChange)="togglePayrollSelection(payroll.id)">
  </span>
</td>
```

### Key Changes from Native HTML Checkboxes

| Aspect | Native HTML Checkbox | ZardUI Checkbox |
|--------|---------------------|-----------------|
| **Element** | `<input type="checkbox">` | `<span z-checkbox>` |
| **Binding** | `[checked]` + `(change)` | `[(ngModel)]` + `(ngModelChange)` |
| **Styling** | Browser default + Tailwind classes | Custom styled with checkmark icon |
| **Appearance** | Standard checkbox | Modern box with animated checkmark |
| **Import Required** | None | `ZardCheckboxComponent` |

### ZardUI Checkbox Features

1. **Custom Design**: Modern square/rounded box design
2. **Checkmark Icon**: SVG check icon that fades in smoothly
3. **States**:
   - Unchecked: Empty box with border
   - Checked: Primary color background + white checkmark
   - Hover: Border color changes
   - Disabled: Opacity reduced
4. **Accessibility**: Full keyboard support (Space/Enter keys)
5. **Two-way Binding**: Works seamlessly with `[(ngModel)]`

### Optional: Custom Styling

You can customize the checkbox appearance with CSS classes:

```html
<!-- Light border when unchecked -->
<span z-checkbox
  [(ngModel)]="selectAll"
  (ngModelChange)="toggleSelectAll()"
  class="border-primary/30">
</span>
```

---

## 8. Alert Dialog Integration

### Features
- Replace native `confirm()` and `alert()` with Zard UI dialogs
- Professional, consistent UI
- Destructive action styling
- Success/error feedback

### Installation

```bash
npx @ngzard/ui add alert-dialog -y
```

### TypeScript Implementation

#### 8.1 Import and Inject Service
```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { ZardAlertDialogService } from '@/shared/components/alert-dialog/alert-dialog.service';

export class YourComponent {
  private alertDialogService = inject(ZardAlertDialogService);
}
```

#### 8.2 Confirmation Dialog Example
```typescript
submitForApproval(payroll: Payroll): void {
  this.alertDialogService.confirm({
    zTitle: 'Submit for Approval',
    zDescription: `Are you sure you want to submit payroll for ${payroll.employee?.full_name} for approval?`,
    zOkText: 'Submit',
    zCancelText: 'Cancel',
    zOnOk: () => {
      this.payrollService.submitForApproval(payroll.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.alertDialogService.info({
              zTitle: 'Success',
              zDescription: 'Payroll submitted for approval successfully',
              zOkText: 'OK'
            });
            this.loadPayrolls();
          }
        },
        error: (err) => {
          this.alertDialogService.warning({
            zTitle: 'Error',
            zDescription: 'Failed to submit payroll for approval',
            zOkText: 'OK'
          });
        }
      });
    }
  });
}
```

#### 8.3 Destructive Action Example
```typescript
cancelPayroll(payroll: Payroll): void {
  this.alertDialogService.confirm({
    zTitle: 'Cancel Payroll',
    zDescription: `Are you sure you want to cancel this payroll for ${payroll.employee?.full_name}? This action cannot be undone.`,
    zOkText: 'Cancel Payroll',
    zCancelText: 'Go Back',
    zOkDestructive: true,  // Destructive styling
    zOnOk: () => {
      // Handle cancellation
    }
  });
}
```

#### 8.4 Warning Dialog Example
```typescript
bulkApprove(): void {
  const selected = Array.from(this.selectedPayrolls());
  if (selected.length === 0) {
    this.alertDialogService.warning({
      zTitle: 'No Selection',
      zDescription: 'Please select payrolls to approve',
      zOkText: 'OK'
    });
    return;
  }
  // Continue with bulk approve
}
```

### Alert Dialog Options

| Property | Type | Purpose | Example |
|----------|------|---------|---------|
| `zTitle` | string | Dialog heading | 'Confirm Action' |
| `zDescription` | string | Dialog body text | 'Are you sure?' |
| `zOkText` | string | Confirm button label | 'Submit', 'Delete' |
| `zCancelText` | string | Cancel button label | 'Cancel', 'Go Back' |
| `zOkDestructive` | boolean | Destructive styling | true for delete/cancel |
| `zOnOk` | Callback | Confirm handler | () => { ... } |
| `zOnCancel` | Callback | Cancel handler | () => { ... } |

### Service Methods

- `confirm()` - Confirmation dialog with OK/Cancel buttons
- `warning()` - Warning alert with just OK button
- `info()` - Informational alert with OK button

---

## 9. Complete Code Examples

### 9.1 Complete CSS File
```css
/* Payroll List Component - Table Styling */

/* Tab navigation scrollbar styling */
.nav-tab-scroll {
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

.nav-tab-scroll::-webkit-scrollbar-thumb {
  background-color: rgba(209, 209, 209, 0.2);
  border-radius: 2px;
}

.nav-tab-scroll::-webkit-scrollbar {
  height: 4px;
  width: 4px;
}

.nav-tab-scroll::-webkit-scrollbar-button {
  display: none;
}

/* Table fixed height rows with horizontal scroll */
.payroll-table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.payroll-table-container::-webkit-scrollbar {
  height: 8px;
}

.payroll-table-container::-webkit-scrollbar-thumb {
  background-color: rgba(209, 209, 209, 0.5);
  border-radius: 4px;
}

.payroll-table-container::-webkit-scrollbar-track {
  background-color: rgba(209, 209, 209, 0.1);
}

.payroll-table tbody tr {
  height: 60px;
}

.payroll-table th,
.payroll-table td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
}

.payroll-table th.th-text-center {
  text-align: center !important;
}
```

### 9.2 Sample Table Header HTML
```html
<div class="payroll-table-container rounded-lg border" *ngIf="items().length > 0">
  <table z-table class="payroll-table">
    <thead>
      <tr>
        <!-- Checkbox Column with ZardUI -->
        <th class="!pl-3 w-10 th-text-center">
          <span z-checkbox [(ngModel)]="selectAll" (ngModelChange)="toggleSelectAll()"></span>
        </th>

        <!-- Sortable Text Column -->
        <th class="!pl-3">
          <button (click)="onSort('name')"
            class="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
            [class.text-primary]="isSortActive('name')">
            <span>Name</span>
            <z-icon [zType]="getSortIcon('name')" class="w-4 h-4" />
          </button>
        </th>

        <!-- Sortable Number Column -->
        <th>
          <button (click)="onSort('amount')"
            class="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer"
            [class.text-primary]="isSortActive('amount')">
            <span>Amount</span>
            <z-icon [zType]="getSortIcon('amount')" class="w-4 h-4" />
          </button>
        </th>

        <!-- Actions Column -->
        <th class="!pr-3">Actions</th>
      </tr>
    </thead>
    <tbody>
      <!-- Table rows -->
    </tbody>
  </table>
</div>
```

### 9.3 Sample Table Row HTML
```html
<tr *ngFor="let item of items()">
  <!-- Checkbox with ZardUI -->
  <td class="!pl-3 text-center">
    <span z-checkbox
      [ngModel]="isSelected(item.id)"
      (ngModelChange)="toggleSelection(item.id)">
    </span>
  </td>

  <!-- Text Column -->
  <td class="!pl-3">
    <div class="flex flex-col">
      <span class="font-medium text-foreground">{{ item.name }}</span>
      <span class="text-sm text-muted-foreground">{{ item.subtitle }}</span>
    </div>
  </td>

  <!-- Number Column -->
  <td>{{ formatCurrency(item.amount) }}</td>

  <!-- Actions Column -->
  <td class="!pr-3 text-right">
    <div class="flex gap-2 flex-nowrap">
      <a [routerLink]="['/items', item.id]" z-button zType="outline" zSize="sm"
        [zTooltip]="'View'">
        <z-icon zType="eye" class="w-4 h-4" />
      </a>
      <button *ngIf="canEdit(item)" (click)="edit(item)" z-button zType="outline" zSize="sm"
        [zTooltip]="'Edit'">
        <z-icon zType="pencil" class="w-4 h-4" />
      </button>
      <button *ngIf="canDelete(item)" (click)="delete(item)" z-button zType="outline" zSize="sm"
        [zTooltip]="'Delete'" class="text-red-600 hover:text-red-700">
        <z-icon zType="trash-2" class="w-4 h-4" />
      </button>
    </div>
  </td>
</tr>
```

---

## Quick Checklist

When applying these improvements to other list pages:

### CSS
- [ ] Add `.your-table-container` class with horizontal scroll
- [ ] Add custom scrollbar styling
- [ ] Set fixed row height (60px)
- [ ] Add `white-space: nowrap`, `overflow: hidden`, `text-overflow: ellipsis`
- [ ] Add `vertical-align: middle`
- [ ] Add `.th-text-center` class for centered columns
- [ ] **IMPORTANT**: Fix main layout CSS to use `z-content > main` instead of `z-content main` (prevents checkbox styling conflicts)

### TypeScript
- [ ] Import `ZardCheckboxComponent` from `@/shared/components/checkbox/checkbox.component`
- [ ] Add `ZardCheckboxComponent` to component imports array
- [ ] Add `sortColumn` and `sortDirection` signals
- [ ] Import `inject` from Angular core
- [ ] Import and inject `ZardAlertDialogService`
- [ ] Implement `onSort()` method
- [ ] Implement sort logic in `sortItems()` method (customize for your data)
- [ ] Implement `getSortIcon()` method
- [ ] Implement `isSortActive()` method
- [ ] Replace all `confirm()` with `alertDialogService.confirm()`
- [ ] Replace all `alert()` with `alertDialogService.info()` or `warning()`

### HTML
- [ ] Add container div with `your-table-container` class
- [ ] Add `your-table` class to table element
- [ ] Replace native `<input type="checkbox">` with `<span z-checkbox>`
- [ ] Update checkbox bindings from `[checked]` + `(change)` to `[(ngModel)]` + `(ngModelChange)`
- [ ] Wrap column headers in clickable buttons
- [ ] Add sort icons to sortable columns
- [ ] Remove decorative icons from column headers
- [ ] Add `th-text-center` class to checkbox column header
- [ ] Add `text-center` class to checkbox column cells
- [ ] Use `flex-nowrap` in actions column

### Install Dependencies
```bash
npx @ngzard/ui add alert-dialog -y
```

---

## Tips & Best Practices

1. **Sorting Logic**: Customize the `switch` statement in `sortItems()` based on your data structure
2. **Icon Types**: Ensure `'chevrons-up-down'`, `'chevron-up'`, and `'chevron-down'` are available in your icon library
3. **Row Height**: Adjust the 60px height if needed for your content
4. **Scrollbar Styling**: Customize colors to match your theme
5. **Alert Dialogs**: Use `zOkDestructive: true` for delete/cancel actions
6. **Accessibility**: Keep checkbox columns accessible with proper labels
7. **Performance**: For large datasets, consider server-side sorting instead of client-side

---

## Browser Compatibility

- **Scrollbar Styling**: WebKit browsers only (Chrome, Safari, Edge)
- **Other Features**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Fallback**: Default scrollbars appear in non-WebKit browsers

---

**Reference Implementation**: Payroll List Component
**File Locations**:
- CSS: `src/app/features/payroll/components/payroll-list/payroll-list.component.css`
- TypeScript: `src/app/features/payroll/components/payroll-list/payroll-list.component.ts`
- HTML: `src/app/features/payroll/components/payroll-list/payroll-list.component.html`

---

*Last Updated: 2026-01-09*

---

## Recent Updates

### 2026-01-09: ZardUI Checkbox Integration
- Replaced native HTML checkboxes with ZardUI checkbox component
- Added custom styled checkbox with animated checkmark icon
- Fixed CSS conflicts with main layout (child combinator fix)
- Updated all code examples and checklist
- Added comparison table between native and ZardUI checkboxes
