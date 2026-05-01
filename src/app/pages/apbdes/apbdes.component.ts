import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
      <header class="header-actions mb-10 flex-between items-end">
        <div class="titles">
          <h2 class="title-gradient">Transparansi Dana Desa (APBDes)</h2>
          <p class="text-muted">Laporan realisasi anggaran pendapatan dan belanja desa tahun berjalan untuk keterbukaan publik.</p>
        </div>
        <div class="flex gap-4 items-center">
          <div class="filter-box">
             <span class="label">TAHUN</span>
             <select [(ngModel)]="selectedYear" (change)="refreshData()" class="year-select">
               <option *ngFor="let y of years" [value]="y">{{ y }}</option>
             </select>
          </div>
          <button class="btn-primary" (click)="openAddModal()" aria-label="Tambah Anggaran">
            Tambah Anggaran 💰
          </button>
        </div>
      </header>

      <!-- Financial Summary Dashboard -->
      <section class="financial-dashboard grid grid-cols-3 gap-6 mb-12" aria-label="Ringkasan Keuangan">
        <div class="card-luxury finance-card income">
          <div class="card-header flex-between mb-4">
             <span class="f-label">TOTAL PENDAPATAN</span>
             <span class="f-icon">📈</span>
          </div>
          <h3 class="f-value text-slate-900 font-black text-3xl">Rp {{ totalIncome() | number:'1.0-0' }}</h3>
          <div class="progress-container mt-6">
             <div class="progress-bar bg-emerald-500 shadow-emerald-200" style="width: 100%"></div>
          </div>
          <p class="text-[10px] font-extrabold text-emerald-600 mt-3 tracking-widest uppercase">Target Tercapai 100%</p>
        </div>

        <div class="card-luxury finance-card expense">
          <div class="card-header flex-between mb-4">
             <span class="f-label">TOTAL BELANJA</span>
             <span class="f-icon">📉</span>
          </div>
          <h3 class="f-value text-slate-900 font-black text-3xl">Rp {{ totalExpense() | number:'1.0-0' }}</h3>
          <div class="progress-container mt-6">
             <div class="progress-bar bg-rose-500 shadow-rose-200" [style.width.%]="expenseRatio()"></div>
          </div>
          <p class="text-[10px] font-extrabold text-rose-600 mt-3 tracking-widest uppercase">Realisasi: {{ expenseRatio() | number:'1.0-1' }}%</p>
        </div>

        <div class="card-luxury finance-card balance">
          <div class="card-header flex-between mb-4">
             <span class="f-label">SISA LEBIH (SURPLUS)</span>
             <span class="f-icon">🏛️</span>
          </div>
          <h3 class="f-value font-black text-3xl" [class.text-rose-600]="surplus() < 0" [class.text-slate-900]="surplus() >= 0">
             Rp {{ surplus() | number:'1.0-0' }}
          </h3>
          <div class="efficiency-gauge mt-6 flex items-center gap-3">
             <div class="gauge-track flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="gauge-fill h-full bg-primary" [style.width.%]="efficiency()"></div>
             </div>
             <span class="text-[10px] font-black text-primary">{{ efficiency() | number:'1.0-1' }}%</span>
          </div>
          <p class="text-[10px] font-extrabold text-slate-400 mt-3 tracking-widest uppercase">Indeks Efisiensi Anggaran</p>
        </div>
      </section>

      <!-- Budget Data Table -->
      <main class="budget-section" aria-label="Rincian Anggaran">
        <div class="card-luxury p-0 overflow-hidden shadow-2xl border-slate-200">
          <table class="luxury-table w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="py-5 px-8 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">NAMA ANGGARAN</th>
                <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">KATEGORI</th>
                <th class="py-5 px-6 text-right text-[10px] font-black text-slate-400 tracking-widest uppercase">JUMLAH (IDR)</th>
                <th class="py-5 px-6 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">TAHAP</th>
                <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">KOORDINATOR</th>
                <th class="py-5 px-8 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of budgetItems()" class="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td class="py-5 px-8">
                   <div class="font-black text-slate-900">{{ item.budget_name }}</div>
                   <div class="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {{ item.id }}</div>
                </td>
                <td class="py-5 px-6">
                  <span class="type-pill" [attr.data-type]="item.type">
                    {{ item.type === 1 ? 'PENDAPATAN' : item.type === 2 ? 'BELANJA' : 'PEMBIAYAAN' }}
                  </span>
                </td>
                <td class="py-5 px-6 text-right font-black text-slate-900 tabular-nums">
                   Rp {{ item.amount | number:'1.0-0' }}
                </td>
                <td class="py-5 px-6 text-center">
                   <span class="phase-badge">{{ item.phase || 'N/A' }}</span>
                </td>
                <td class="py-5 px-6">
                   <div class="text-slate-700 font-bold text-sm">{{ item.coordinator || 'Bendahara Desa' }}</div>
                </td>
                <td class="py-5 px-8">
                  <div class="flex justify-center gap-2">
                    <button class="btn-icon-sm border border-slate-200" (click)="editBudget(item)" title="Edit">✏️</button>
                    <button class="btn-icon-sm delete border border-slate-200" (click)="deleteBudget(item.id!)" title="Hapus">🗑️</button>
                  </div>
                </td>
              </tr>
              <!-- Empty State -->
              <tr *ngIf="budgetItems().length === 0">
                 <td colspan="6" class="py-20 text-center">
                    <div class="text-4xl mb-4">💰</div>
                    <h4 class="text-slate-900 font-black">Belum ada data anggaran untuk tahun {{ selectedYear }}</h4>
                    <p class="text-muted text-sm mt-2">Silakan klik "Tambah Anggaran" untuk mulai menginput data.</p>
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <!-- Budget Entry Modal -->
      <div *ngIf="isAddModalOpen()" class="form-overlay fade-in" (click)="isAddModalOpen.set(false)">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <header class="modal-header mb-10">
            <h2 class="title-gradient text-3xl">{{ isEditing() ? 'Edit' : 'Input' }} Data APBDes</h2>
            <p class="text-muted text-lg">Input data anggaran harus sesuai dengan dokumen fisik APBDes Desa.</p>
          </header>
          
          <form (submit)="saveBudget()" class="grid grid-cols-2 gap-8">
            <div class="input-group">
              <label>Tipe / Jenis Anggaran</label>
              <select [(ngModel)]="budgetForm.type" name="type" required class="custom-select">
                <option [ngValue]="1">Pendapatan Desa</option>
                <option [ngValue]="2">Belanja Desa</option>
                <option [ngValue]="3">Pembiayaan Desa</option>
              </select>
            </div>
            <div class="input-group">
              <label>Tahun Anggaran</label>
              <input type="number" [(ngModel)]="budgetForm.year" name="year" required class="custom-input font-bold">
            </div>
            
            <div class="input-group col-span-2">
              <label>Nama Anggaran / Program Kegiatan</label>
              <input [(ngModel)]="budgetForm.budget_name" name="name" placeholder="Contoh: Dana Desa Tahap I 2026" required class="custom-input font-black text-lg">
            </div>
            
            <div class="input-group">
              <label>Jumlah Dana (IDR)</label>
              <input type="number" [(ngModel)]="budgetForm.amount" name="amount" placeholder="0" required class="custom-input text-primary font-black">
            </div>
            <div class="input-group">
              <label>Tahap / Persentase</label>
              <input [(ngModel)]="budgetForm.phase" name="phase" placeholder="Contoh: Tahap 1 (40%)" class="custom-input">
            </div>
            
            <div class="input-group col-span-2">
              <label>Koordinator Pelaksana (PTPKD)</label>
              <input [(ngModel)]="budgetForm.coordinator" name="coordinator" placeholder="Nama koordinator atau pelaksana kegiatan" class="custom-input">
            </div>

            <footer class="form-actions mt-10 col-span-2 flex justify-end gap-3 border-t border-slate-100 pt-8">
              <button type="button" class="btn-outline px-10" (click)="isAddModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary px-10" [disabled]="loading()">
                {{ loading() ? 'Sedang Menyimpan...' : (isEditing() ? 'Simpan Perubahan' : 'Terbitkan Data Anggaran') }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .apbdes-container { padding-bottom: 5rem; }
    .header-actions { border-bottom: 2px solid #f1f5f9; padding-bottom: 2.5rem; }
    
    .filter-box {
       display: flex; flex-direction: column; gap: 0.5rem;
       .label { font-size: 0.65rem; font-weight: 900; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase; }
       .year-select { 
         background: #f1f5f9; border: 2px solid transparent; padding: 0.6rem 1.5rem; border-radius: 1rem; 
         font-weight: 800; outline: none; transition: 0.3s;
         &:focus { border-color: #2563eb; background: white; }
       }
    }
 
    .finance-card {
       padding: 3rem; border: 1px solid #e2e8f0; position: relative; overflow: hidden; background: white;
       transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
       &:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.08); }
       
       .f-label { font-size: 0.75rem; font-weight: 900; color: #64748b; letter-spacing: 0.15em; text-transform: uppercase; }
       .f-icon { font-size: 2rem; opacity: 0.8; }
       .f-value { letter-spacing: -0.02em; }
       .progress-container { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
       .progress-bar { height: 100%; border-radius: 4px; }
    }
 
    .luxury-table {
       border-collapse: separate;
       border-spacing: 0;
       th { 
         background: #f8fafc; border-bottom: 2px solid #f1f5f9; color: #000000; 
         font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
       }
       .type-pill {
          padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.65rem; font-weight: 800;
          &[data-type='1'] { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
          &[data-type='2'] { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
          &[data-type='3'] { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }
       }
       .phase-badge { background: #f1f5f9; padding: 0.35rem 0.75rem; border-radius: 0.75rem; font-size: 0.7rem; font-weight: 800; color: #64748b; border: 1px solid #e2e8f0; }
       .tabular-nums { font-family: 'JetBrains Mono', monospace; font-size: 1rem; }
    }
 
    .form-overlay { position: fixed; inset: 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 900px; padding: 4.5rem; }
    
    .input-group label { display: block; font-size: 0.85rem; font-weight: 800; color: #000000; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
 
    .custom-input, .custom-select {
       background: #f1f5f9; border: 2px solid transparent; padding: 1.1rem 1.5rem; border-radius: 1.25rem;
       outline: none; font-weight: 700; font-size: 1rem; width: 100%; transition: all 0.3s; color: #000000;
       &:focus { border-color: #2563eb; background: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1); }
    }
  `]
})
export class ApbdesComponent implements OnInit {
  private dataService = inject(DataService);

  budgetItems = signal<APBDes[]>([]);
  selectedYear = new Date().getFullYear();
  years = [2026, 2025, 2024, 2023];

  isAddModalOpen = signal(false);
  loading = signal(false);
  isEditing = signal(false);
  budgetForm: Partial<APBDes> = this.resetForm();

  // Computed signals for reativity
  totalIncome = computed(() => {
    return this.budgetItems()
      .filter(i => i.type === 1)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  });

  totalExpense = computed(() => {
    return this.budgetItems()
      .filter(i => i.type === 2)
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  });

  surplus = computed(() => this.totalIncome() - this.totalExpense());
  
  expenseRatio = computed(() => {
    if (this.totalIncome() === 0) return 0;
    return (this.totalExpense() / this.totalIncome()) * 100;
  });

  efficiency = computed(() => {
     const ratio = this.expenseRatio();
     return Math.max(0, 100 - ratio);
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.dataService.getAPBDes(this.selectedYear).subscribe(data => {
      this.budgetItems.set(data);
    });
  }

  resetForm(): Partial<APBDes> {
    return {
      type: 1,
      year: this.selectedYear,
      bar_color: 'info',
      amount: 0
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

  async saveBudget() {
    this.loading.set(true);
    try {
      if (this.isEditing()) {
        await this.dataService.updateAPBDes(this.budgetForm as APBDes);
      } else {
        await this.dataService.addAPBDes(this.budgetForm as APBDes);
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
    if (confirm('Hapus data anggaran ini secara permanen?')) {
      try {
        await this.dataService.deleteAPBDes(id);
        this.refreshData();
      } catch (err: any) {
        alert('Gagal menghapus anggaran: ' + err.message);
      }
    }
  }
}
