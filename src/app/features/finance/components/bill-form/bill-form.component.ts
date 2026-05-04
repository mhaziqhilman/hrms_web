import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FinanceService } from '../../services/finance.service';
import { ProjectService } from '@/features/projects/services/project.service';
import { BillType } from '../../models/finance.model';
import { Project } from '@/features/projects/models/project.model';

interface ItemRow {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

@Component({
  selector: 'app-bill-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bill-form.component.html'
})
export class BillFormComponent implements OnInit {
  private financeService = inject(FinanceService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  saving = signal(false);
  isEdit = signal(false);
  publicId = signal<string | null>(null);
  projects = signal<Project[]>([]);

  form = {
    bill_type: 'Bill' as BillType,
    bill_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    vendor_name: '',
    vendor_invoice_number: '',
    vendor_tin: '',
    vendor_address: '',
    vendor_email: '',
    category: '',
    currency: 'MYR',
    project_public_id: '',
    notes: ''
  };

  items = signal<ItemRow[]>([
    { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }
  ]);

  totals = computed(() => {
    let subtotal = 0, tax = 0, total = 0;
    for (const it of this.items()) {
      const lineSubtotal = (+it.quantity || 0) * (+it.unit_price || 0);
      const lineTax = lineSubtotal * ((+it.tax_rate || 0) / 100);
      subtotal += lineSubtotal;
      tax += lineTax;
      total += lineSubtotal + lineTax;
    }
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  });

  ngOnInit() {
    this.projectService.list({ limit: 200 }).subscribe(res => {
      this.projects.set(res.data.projects);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.publicId.set(id);
      this.loadBill(id);
    }

    // Optional preselect via query param
    const projectQ = this.route.snapshot.queryParamMap.get('project');
    if (projectQ) this.form.project_public_id = projectQ;
  }

  loadBill(id: string) {
    this.loading.set(true);
    this.financeService.getBill(id).subscribe({
      next: res => {
        const b = res.data;
        this.form.bill_type = b.bill_type;
        this.form.bill_date = b.bill_date;
        this.form.due_date = b.due_date || '';
        this.form.vendor_name = b.vendor_name;
        this.form.vendor_invoice_number = b.vendor_invoice_number || '';
        this.form.vendor_tin = b.vendor_tin || '';
        this.form.vendor_address = b.vendor_address || '';
        this.form.vendor_email = b.vendor_email || '';
        this.form.category = b.category || '';
        this.form.currency = b.currency;
        this.form.project_public_id = b.project?.public_id || '';
        this.form.notes = b.notes || '';
        this.items.set(b.items?.map(i => ({
          description: i.description,
          quantity: +i.quantity,
          unit_price: +i.unit_price,
          tax_rate: +i.tax_rate
        })) || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  addItem() {
    this.items.update(arr => [...arr, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]);
  }

  removeItem(idx: number) {
    if (this.items().length === 1) return;
    this.items.update(arr => arr.filter((_, i) => i !== idx));
  }

  updateItem(idx: number, field: keyof ItemRow, value: any) {
    this.items.update(arr => {
      const next = [...arr];
      next[idx] = { ...next[idx], [field]: field === 'description' ? value : +value };
      return next;
    });
  }

  save() {
    if (!this.form.vendor_name || !this.form.bill_date) return;
    if (this.items().some(it => !it.description || it.unit_price < 0)) return;

    this.saving.set(true);
    const payload: any = {
      ...this.form,
      due_date: this.form.due_date || null,
      project_public_id: this.form.project_public_id || null,
      items: this.items()
    };

    const req = this.isEdit() && this.publicId()
      ? this.financeService.updateBill(this.publicId()!, payload)
      : this.financeService.createBill(payload);

    req.subscribe({
      next: res => {
        this.saving.set(false);
        const id = this.isEdit() ? this.publicId() : res.data.public_id;
        this.router.navigate(['/finance/bills', id]);
      },
      error: () => this.saving.set(false)
    });
  }

  cancel() {
    if (this.isEdit() && this.publicId()) {
      this.router.navigate(['/finance/bills', this.publicId()]);
    } else {
      this.router.navigate(['/finance/bills']);
    }
  }

  formatMoney(v: number): string {
    return `${this.form.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
