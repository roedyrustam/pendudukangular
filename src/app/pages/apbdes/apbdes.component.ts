import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { APBDes } from '../../models/data.models';

@Component({
  selector: 'app-apbdes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="apbdes-container fade-in">
      <header class="mb-8 flex justify-between items-end">
        <div>
          <h2 class="title-gradient">Transparansi Dana Desa (APBDes)</h2>
          <p class="text-muted">Laporan realisasi anggaran pendapatan dan belanja desa tahun berjalan.</p>
        </div>
        <div class="flex gap-4">
          <select [(ngModel)]="selectedYear" (change)="refreshData()" class="year-select">
            <option *ngFor="let y of years" [value]="y">{{ y }}</option>
          </select>
          <button class="btn-primary" (click)="openAddModal()">
            Tambah Anggaran 💰
          </button>
        </div>
      </header>

      <!-- Summary Stats -->
      <div class="stats-row mb-10">
        <div class="card-luxury glass-panel stat-card income">
          <span class="label">Total Pendapatan</span>
          <h3 class="value">Rp {{ totalIncome() | number:'1.0-0' }}</h3>
          <div class="progress-track"><div class="progress-bar" style="width: 100%"></div></div>
        </div>
        <div class="card-luxury glass-panel stat-card expense">
          <span class="label">Total Belanja</span>
          <h3 class="value">Rp {{ totalExpense() | number:'1.0-0' }}</h3>
          <div class="progress-track"><div class="progress-bar" [style.width.%]="(totalExpense() / totalIncome()) * 100"></div></div>
        </div>
        <div class="card-luxury glass-panel stat-card surplus">
          <span class="label">Surplus / Defisit</span>
          <h3 class="value" [class.negative]="totalIncome() - totalExpense() < 0">
            Rp {{ (totalIncome() - totalExpense()) | number:'1.0-0' }}
          </h3>
          <span class="text-xs text-muted">Efisiensi: {{ 100 - ((totalExpense() / totalIncome()) * 100) | number:'1.0-1' }}%</span>
        </div>
      </div>

      <!-- Budget Table -->
      <div class="card-luxury p-0 overflow-hidden mb-10">
        <table class="luxury-table">
          <thead>
            <tr>
              <th>Nama Anggaran</th>
              <th>Jenis</th>
              <th>Jumlah (IDR)</th>
              <th>Tahap</th>
              <th>Koordinator</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of budgetItems()">
              <td class="font-bold">{{ item.budget_name }}</td>
              <td>
                <span class="badge" [class.income]="item.type === 1" [class.expense]="item.type === 2">
                  {{ item.type === 1 ? 'Pendapatan' : 'Belanja' }}
                </span>
              </td>
              <td class="amount">Rp {{ item.amount | number:'1.0-0' }}</td>
              <td>{{ item.phase || '-' }}</td>
              <td>{{ item.coordinator || '-' }}</td>
              <td>
                <div class="flex gap-2">
                  <button class="btn-icon-sm" (click)="editBudget(item)">✏️</button>
                  <button class="btn-icon-sm text-red" (click)="deleteBudget(item.id!)">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Modal -->
      <div *ngIf="isAddModalOpen()" class="form-overlay" (click)="isAddModalOpen.set(false)">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header mb-6">
            <h3 class="title-gradient">{{ isEditing() ? 'Edit' : 'Input' }} Data APBDes</h3>
            <p class="text-muted">Masukkan rincian anggaran pendapatan atau belanja.</p>
          </div>
          
          <form (submit)="saveBudget()">
            <div class="grid-2 mb-4">
              <div class="input-group">
                <label>Tipe Anggaran</label>
                <select [(ngModel)]="budgetForm.type" name="type" required>
                  <option [ngValue]="1">Pendapatan</option>
                  <option [ngValue]="2">Belanja</option>
                  <option [ngValue]="3">Pembiayaan</option>
                </select>
              </div>
              <div class="input-group">
                <label>Tahun Anggaran</label>
                <input type="number" [(ngModel)]="budgetForm.year" name="year" required>
              </div>
            </div>
            <div class="input-group mb-4">
              <label>Nama Anggaran</label>
              <input [(ngModel)]="budgetForm.budget_name" name="name" placeholder="Contoh: Dana Desa Tahap I" required>
            </div>
            <div class="grid-2 mb-4">
              <div class="input-group">
                <label>Jumlah (Rupiah)</label>
                <input type="number" [(ngModel)]="budgetForm.amount" name="amount" placeholder="0" required>
              </div>
              <div class="input-group">
                <label>Tahap / Keterangan</label>
                <input [(ngModel)]="budgetForm.phase" name="phase" placeholder="Contoh: Tahap 1 (40%)">
              </div>
            </div>
            <div class="input-group mb-6">
              <label>Koordinator Pelaksana (PTPKD)</label>
              <input [(ngModel)]="budgetForm.coordinator" name="coordinator" placeholder="Nama koordinator kegiatan">
            </div>
            <div class="form-actions mt-8">
              <button type="button" class="btn-text" (click)="isAddModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary" [disabled]="loading()">
                {{ loading() ? 'Menyimpan...' : (isEditing() ? 'Simpan Perubahan' : 'Simpan Data Anggaran') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .apbdes-container { padding-bottom: 4rem; }
    .year-select {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: 600;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .stat-card {
      padding: 1.5rem;
      .label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
      .value { font-size: 1.75rem; margin: 0.5rem 0; font-weight: 800; }
      &.income .value { color: #34d399; }
      &.expense .value { color: #fb7185; }
      .negative { color: #ef4444; }
      .progress-track {
        height: 4px;
        background: rgba(255,255,255,0.1);
        border-radius: 2px;
        margin-top: 1rem;
        overflow: hidden;
        .progress-bar { height: 100%; transition: width 1s ease; }
      }
      &.income .progress-bar { background: #34d399; box-shadow: 0 0 10px rgba(52, 211, 153, 0.5); }
      &.expense .progress-bar { background: #fb7185; box-shadow: 0 0 10px rgba(251, 113, 133, 0.5); }
    }
    .luxury-table {
      width: 100%;
      border-collapse: collapse;
      th { text-align: left; padding: 1rem 1.5rem; background: rgba(255,255,255,0.02); color: var(--text-muted); font-weight: 500; font-size: 0.8rem; }
      td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
      .amount { font-family: 'Courier New', Courier, monospace; font-weight: 700; color: #fff; }
    }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      &.income { background: rgba(52, 211, 153, 0.1); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.2); }
      &.expense { background: rgba(251, 113, 133, 0.1); color: #fb7185; border: 1px solid rgba(251, 113, 133, 0.2); }
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .p-0 { padding: 0 !important; }
    .overflow-hidden { overflow: hidden; }
  `]
})
export class ApbdesComponent implements OnInit {
  private dataService = inject(DataService);

  budgetItems = signal<APBDes[]>([]);
  selectedYear = new Date().getFullYear();
  years = [2026, 2025, 2024, 2023];

  totalIncome = signal(0);
  totalExpense = signal(0);

  isAddModalOpen = signal(false);
  loading = signal(false);
  isEditing = signal(false);
  budgetForm: Partial<APBDes> = this.resetForm();

  resetForm(): Partial<APBDes> {
    return {
      type: 1,
      year: this.selectedYear,
      bar_color: 'info'
    };
  }

  openAddModal() {
    this.isEditing.set(false);
    this.budgetForm = this.resetForm();
    this.isAddModalOpen.set(true);
  }

  editBudget(item: APBDes) {
    this.isEditing.set(true);
    this.budgetForm = { ...item };
    this.isAddModalOpen.set(true);
  }

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.dataService.getAPBDes(this.selectedYear).subscribe(data => {
      this.budgetItems.set(data);
      this.totalIncome.set(data.filter(i => i.type === 1).reduce((acc, curr) => acc + curr.amount, 0));
      this.totalExpense.set(data.filter(i => i.type === 2).reduce((acc, curr) => acc + curr.amount, 0));
    });
  }

  async saveBudget() {
    this.loading.set(true);
    try {
      if (this.isEditing()) {
        await this.dataService.updateAPBDes(this.budgetForm);
      } else {
        await this.dataService.addAPBDes(this.budgetForm);
      }
      this.refreshData();
      this.isAddModalOpen.set(false);
    } catch (err: any) {
      alert('Gagal menyimpan anggaran: ' + err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteBudget(id: number) {
    if (confirm('Hapus data anggaran ini?')) {
      try {
        await this.dataService.deleteAPBDes(id);
        this.refreshData();
      } catch (err: any) {
        alert('Gagal menghapus anggaran: ' + err.message);
      }
    }
  }
}
