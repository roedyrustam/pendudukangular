import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { Resident, Family } from '../../models/data.models';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="residents-page fade-in">
      <header class="header-actions mb-10 flex-between items-start">
        <div class="titles">
          <h2 class="title-gradient text-4xl">Data Penduduk Terpadu</h2>
          <p class="text-muted text-lg mt-2">Manajemen data individu berbasis NIK seluruh wilayah desa.</p>
          <div class="flex gap-4 mt-8">
            <button class="btn-primary px-10 py-4 rounded-2xl shadow-xl" (click)="isAddModalOpen.set(true)" aria-label="Tambah Penduduk Baru">
               Tambah Penduduk ➕
            </button>
            <button class="btn-outline px-10 py-4 rounded-2xl border-2" (click)="exportToPdf()" aria-label="Ekspor Laporan PDF">
               Ekspor Laporan PDF 📄
            </button>
          </div>
        </div>

        <div class="header-right flex flex-col items-end gap-4">
          <div class="search-box-premium">
            <span class="icon">🔍</span>
            <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Cari NIK, Nama, atau KK..." aria-label="Cari data penduduk">
          </div>
          <div class="live-sync-indicator bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
            <div class="pulse-dot"></div>
            <span class="label">DATABASE CONNECTED</span>
          </div>
        </div>
      </header>

      <!-- Stats Summary Dashboard -->
      <section class="grid grid-cols-3 gap-8 mb-12" aria-label="Ringkasan Statistik">
        <article class="card-luxury p-8 flex-between items-center group hover:border-primary/30 transition-all">
           <div>
              <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-2 block">TOTAL JIWA TERFILTER</span>
              <div class="text-5xl font-black text-slate-900 tabular-nums">{{ filteredResidents().length }}</div>
              <p class="text-xs text-slate-500 font-bold mt-2">Hasil pencarian & filter aktif</p>
           </div>
           <div class="icon-box-large bg-blue-50 text-primary text-3xl p-6 rounded-3xl group-hover:scale-110 transition-transform">📊</div>
        </article>

        <article class="card-luxury p-8 flex-between items-center group hover:border-emerald-200 transition-all">
           <div>
              <span class="text-[10px] font-black text-emerald-600 tracking-widest uppercase mb-2 block">LAKI-LAKI</span>
              <div class="text-5xl font-black text-slate-900 tabular-nums">{{ countGender('Laki-laki') }}</div>
              <p class="text-xs text-slate-500 font-bold mt-2">Distribusi gender maskulin</p>
           </div>
           <div class="icon-box-large bg-emerald-50 text-emerald-600 text-3xl p-6 rounded-3xl group-hover:scale-110 transition-transform">👨</div>
        </article>

        <article class="card-luxury p-8 flex-between items-center group hover:border-rose-200 transition-all">
           <div>
              <span class="text-[10px] font-black text-rose-600 tracking-widest uppercase mb-2 block">PEREMPUAN</span>
              <div class="text-5xl font-black text-slate-900 tabular-nums">{{ countGender('Perempuan') }}</div>
              <p class="text-xs text-slate-500 font-bold mt-2">Distribusi gender feminin</p>
           </div>
           <div class="icon-box-large bg-rose-50 text-rose-600 text-3xl p-6 rounded-3xl group-hover:scale-110 transition-transform">👩</div>
        </article>
      </section>

      <!-- Advanced Filters -->
      <section class="filters-container card-luxury mb-10 p-8 shadow-2xl border-slate-100" aria-label="Panel Filter">
         <div class="grid grid-cols-4 gap-8 items-end">
            <div class="filter-group">
              <label class="text-[10px] font-black text-slate-400 mb-3 block tracking-widest uppercase">FILTER JENIS KELAMIN</label>
              <select [ngModel]="filterGender()" (ngModelChange)="filterGender.set($event)" class="custom-select" aria-label="Filter Gender">
                <option value="">-- Semua Gender --</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="text-[10px] font-black text-slate-400 mb-3 block tracking-widest uppercase">FILTER PEKERJAAN</label>
              <select [ngModel]="filterOccupation()" (ngModelChange)="filterOccupation.set($event)" class="custom-select" aria-label="Filter Pekerjaan">
                <option value="">-- Semua Pekerjaan --</option>
                <option *ngFor="let job of occupationList()" [value]="job">{{ job }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label class="text-[10px] font-black text-slate-400 mb-3 block tracking-widest uppercase">BARIS PER HALAMAN</label>
              <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event); currentPage.set(1)" class="custom-select" aria-label="Jumlah baris per halaman">
                <option [ngValue]="10">10 Baris</option>
                <option [ngValue]="25">25 Baris</option>
                <option [ngValue]="50">50 Baris</option>
              </select>
            </div>
            <div class="flex justify-end pb-1">
               <button class="btn-text font-black text-rose-600 uppercase text-[10px] tracking-widest" (click)="resetFilters()">Reset Filter 🔄</button>
            </div>
         </div>
      </section>

      <!-- Data Table -->
      <main class="card-luxury p-0 overflow-hidden shadow-2xl border-slate-200">
        <table class="luxury-table w-full">
          <thead>
            <tr class="bg-slate-50">
              <th class="py-5 px-8 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">NIK / IDENTITAS</th>
              <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">NAMA LENGKAP</th>
              <th class="py-5 px-6 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">GENDER</th>
              <th class="py-5 px-6 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">STATUS</th>
              <th class="py-5 px-6 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">HUBUNGAN</th>
              <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">NO. KK</th>
              <th class="py-5 px-8 text-right text-[10px] font-black text-slate-400 tracking-widest uppercase">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of paginatedResidents()" class="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td class="py-5 px-8 font-black text-primary font-mono tracking-tighter">{{ r.nik }}</td>
              <td class="py-5 px-6">
                 <div class="font-black text-slate-900 text-base">{{ r.full_name }}</div>
                 <div class="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-1">{{ r.occupation || 'TIDAK BEKERJA' }}</div>
              </td>
              <td class="py-5 px-6 text-center">
                 <span class="gender-pill" [attr.data-gender]="r.gender">{{ r.gender === 'Laki-laki' ? 'L' : 'P' }}</span>
              </td>
              <td class="py-5 px-6 text-center">
                <span class="status-badge" [attr.data-status]="r.status_dasar?.toLowerCase() || 'hidup'">
                  {{ r.status_dasar || 'HIDUP' }}
                </span>
              </td>
              <td class="py-5 px-6 text-center">
                 <span class="relation-badge">{{ r.relationship }}</span>
              </td>
              <td class="py-5 px-6">
                 <span class="kk-tag" (click)="viewFamily(r.family_id)">{{ r.family_id }}</span>
              </td>
              <td class="py-5 px-8 text-right">
                <div class="flex justify-end gap-2">
                  <button class="btn-icon-sm border border-slate-200" (click)="viewProfile(r.nik)" title="Profil">👁️</button>
                  <button class="btn-icon-sm border border-slate-200" (click)="editResident(r)" title="Edit">✏️</button>
                  <button class="btn-icon-sm delete border border-slate-200" (click)="deleteResident(r.nik)" title="Hapus">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div *ngIf="filteredResidents().length === 0" class="py-24 text-center">
           <div class="text-6xl mb-6">📂</div>
           <h4 class="text-slate-900 font-black text-xl">Data penduduk tidak ditemukan</h4>
           <p class="text-muted mt-2">Coba sesuaikan kata kunci pencarian atau filter Anda.</p>
        </div>

        <!-- Pagination -->
        <footer class="pagination-area bg-slate-50 p-6 flex-between border-t border-slate-100">
           <div class="text-xs font-bold text-slate-500 uppercase tracking-widest">
              MENAMPILKAN <b class="text-slate-900">{{ startIndex() + 1 }}-{{ endIndex() }}</b> DARI <b class="text-slate-900">{{ totalRecords() }}</b> DATA
           </div>
           <nav class="flex gap-2">
              <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">⬅️ PREV</button>
              <div class="flex gap-1">
                 <button *ngFor="let p of getVisiblePages()" class="btn-page-num" [class.active]="p === currentPage()" (click)="goToPage(p)">{{ p }}</button>
              </div>
              <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">NEXT ➡️</button>
           </nav>
        </footer>
      </main>
    </div>

    <!-- Modals -->
    <div *ngIf="isAddModalOpen()" class="form-overlay fade-in" (click)="isAddModalOpen.set(false)">
      <div class="form-card card-luxury p-10" (click)="$event.stopPropagation()">
        <header class="modal-header mb-10">
          <h2 class="title-gradient text-3xl">Registrasi Penduduk Baru</h2>
          <p class="text-muted text-lg mt-2">Pastikan NIK yang diinput valid dan terdaftar di Kemendagri.</p>
        </header>
        <form (submit)="addNewResident()" class="grid grid-cols-2 gap-8">
           <div class="input-group">
              <label class="text-slate-900 font-black">NOMOR INDUK KEPENDUDUKAN (NIK)</label>
              <input [(ngModel)]="addForm.nik" name="nik" placeholder="3201..." required minlength="16" maxlength="16" class="custom-input font-black text-lg">
           </div>
           <div class="input-group">
              <label class="text-slate-900 font-black">NAMA LENGKAP</label>
              <input [(ngModel)]="addForm.full_name" name="name" placeholder="Sesuai KTP/KIA" required class="custom-input font-black text-lg">
           </div>
           <footer class="col-span-2 pt-10 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" class="btn-outline px-8 rounded-xl font-black text-xs" (click)="isAddModalOpen.set(false)">BATAL</button>
              <button type="submit" class="btn-primary px-12 py-5 rounded-2xl shadow-2xl font-black" [disabled]="loadingAdd()">
                 {{ loadingAdd() ? 'SEDANG MENYIMPAN...' : 'SIMPAN DATA PENDUDUK ✅' }}
              </button>
           </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .residents-page { padding-bottom: 5rem; }
    
    .search-box-premium {
       display: flex; align-items: center; gap: 1rem;
       background: white; border: 1px solid var(--glass-border);
       padding: 1rem 1.75rem; border-radius: 1.5rem; width: 500px;
       transition: 0.4s var(--apple-ease); box-shadow: 0 15px 35px -12px rgba(0,0,0,0.05);
       &:focus-within { border-color: var(--primary); box-shadow: 0 20px 40px -15px var(--primary-glow); }
       input { background: none; border: none; color: #000000; width: 100%; outline: none; font-weight: 800; font-size: 1.1rem; }
       .icon { font-size: 1.25rem; }
    }

    .pulse-dot { width: 10px; height: 10px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
    .label { font-size: 0.65rem; font-weight: 900; color: #059669; letter-spacing: 0.15em; }

    .custom-select, .custom-input {
       background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem 1.25rem; border-radius: 1rem;
       outline: none; font-weight: 600; font-size: 1rem; width: 100%; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }

    .gender-pill {
       padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-weight: 900; font-size: 0.7rem;
       &[data-gender='Laki-laki'] { background: #eff6ff; color: #2563eb; }
       &[data-gender='Perempuan'] { background: #fff1f2; color: #e11d48; }
    }

    .status-badge {
       padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.65rem; font-weight: 900;
       &[data-status='hidup'] { background: #ecfdf5; color: #059669; }
       &[data-status='mati'] { background: #fef2f2; color: #dc2626; }
       &[data-status='pindah'] { background: #fefce8; color: #ca8a04; }
    }

    .relation-badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.65rem; font-weight: 800; }
    .kk-tag { color: var(--primary); font-weight: 900; cursor: pointer; border-bottom: 2px solid var(--primary-glow); font-family: monospace; font-size: 0.9rem; }

    .btn-page-num {
       width: 44px; height: 44px; border-radius: 12px; font-weight: 900; color: #64748b; transition: 0.3s;
       &.active { background: var(--primary); color: white; box-shadow: 0 10px 20px var(--primary-glow); }
    }

    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.9); backdrop-filter: blur(20px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 900px; }
  `]
})
export class ResidentsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private pdfService = inject(PdfService);

  // Constants
  staticOccupations = ['Petani', 'Nelayan', 'Wiraswasta', 'PNS', 'Buruh', 'Karyawan', 'Pelajar/Mahasiswa', 'IRT', 'Lainnya'];

  // Signals
  residents = signal<Resident[]>([]);
  families = signal<Family[]>([]);
  searchTerm = signal('');
  filterGender = signal('');
  filterOccupation = signal('');
  filterHamlet = signal('');
  
  currentPage = signal(1);
  pageSize = signal(10);
  isAddModalOpen = signal(false);
  loadingAdd = signal(false);
  residentToEdit = signal<Resident | null>(null);
  editForm: Partial<Resident> = {};

  // Reactive Derived State
  filteredResidents = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const gender = this.filterGender();
    const occ = this.filterOccupation();
    const ham = this.filterHamlet();

    return this.residents().filter(r => {
      const searchStr = (r.nik + (r.full_name || '') + (r.family_id || '')).toLowerCase();
      return (!term || searchStr.includes(term)) &&
             (!gender || r.gender === gender) &&
             (!occ || r.occupation === occ) &&
             (!ham || r.hamlet === ham);
    }).sort((a,b) => (a.full_name || '').localeCompare(b.full_name || ''));
  });

  paginatedResidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredResidents().slice(start, start + this.pageSize());
  });

  occupationList = computed(() => 
    [...new Set(this.residents().map(r => r.occupation))].filter(Boolean).sort() as string[]
  );

  totalRecords = computed(() => this.filteredResidents().length);
  totalPages = computed(() => Math.max(1, Math.ceil(this.totalRecords() / this.pageSize())));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalRecords()));

  addForm: Partial<Resident> = { gender: 'Laki-laki', relationship: 'ANAK', religion: 'Islam' };
  private subscriptions: any[] = [];

  constructor() {
    this.refreshData();
    this.subscriptions.push(this.dataService.subscribeToResidents(() => this.refreshData()));
  }

  refreshData() {
    this.dataService.getResidents().subscribe(d => this.residents.set(d));
    this.dataService.getFamilies().subscribe(d => this.families.set(d));
  }

  ngOnDestroy() { this.subscriptions.forEach(s => s.unsubscribe()); }

  goToPage(p: number) { if (p >= 1 && p <= this.totalPages()) this.currentPage.set(p); }

  resetFilters() {
    this.searchTerm.set('');
    this.filterGender.set('');
    this.filterOccupation.set('');
    this.filterHamlet.set('');
    this.currentPage.set(1);
  }

  getVisiblePages(): number[] {
    const total = this.totalPages();
    const curr = this.currentPage();
    const pages: number[] = [];
    if (total <= 7) for (let i = 1; i <= total; i++) pages.push(i);
    else {
      if (curr <= 4) for (let i = 1; i <= 5; i++) pages.push(i);
      else if (curr >= total - 3) for (let i = total - 4; i <= total; i++) pages.push(i);
      else for (let i = curr - 2; i <= curr + 2; i++) pages.push(i);
    }
    return pages;
  }

  countGender(g: string) { return this.filteredResidents().filter(r => r.gender === g).length; }
  viewProfile(n: string) { this.router.navigate(['/residents', n]); }
  viewFamily(k: string) { this.router.navigate(['/families'], { queryParams: { search: k } }); }

  editResident(r: Resident) { this.residentToEdit.set(r); this.editForm = { ...r }; }

  async addNewResident() {
    this.loadingAdd.set(true);
    try {
      await this.dataService.addResident(this.addForm as Resident);
      this.isAddModalOpen.set(false);
      this.addForm = { gender: 'Laki-laki', relationship: 'ANAK' };
    } catch (e: any) { alert(e.message); } 
    finally { this.loadingAdd.set(false); }
  }

  async updateResident() {
    try {
      await this.dataService.updateResident(this.editForm as Resident);
      this.residentToEdit.set(null);
    } catch (e: any) { alert(e.message); }
  }

  async deleteResident(n: string) {
    if (confirm('Hapus data penduduk ini secara permanen?')) await this.dataService.deleteResident(n);
  }

  async exportToPdf() {
    await this.pdfService.generateResidentsReport(this.filteredResidents(), 'Laporan Data Penduduk Terpadu');
  }
}
