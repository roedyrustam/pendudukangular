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
    <header class="header-actions mb-8 fade-in">
      <div class="titles">
        <h2 class="title-gradient">Data Penduduk Terpadu</h2>
        <p class="text-muted">Manajemen data individu berbasis NIK seluruh wilayah</p>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" (click)="isAddModalOpen.set(true)" aria-label="Tambah Penduduk Baru">
             Tambah Penduduk ➕
          </button>
          <button class="btn-outline" (click)="exportToPdf()" aria-label="Ekspor Laporan PDF">
             Ekspor Laporan PDF 📄
          </button>
        </div>
      </div>

      <div class="header-right flex flex-col items-end">
        <div class="search-bar mb-4">
          <span class="icon">🔍</span>
          <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Cari NIK atau Nama..." aria-label="Cari data penduduk">
        </div>
        <div class="live-sync-indicator">
          <div class="pulse-dot"></div>
          <span class="label">LIVE DATA SYNC</span>
        </div>
      </div>
    </header>

    <!-- Filter Bar -->
    <section class="filters-container card-luxury mb-8 p-6 fade-in" aria-label="Panel Filter Data">
       <div class="flex gap-6 flex-wrap items-center">
          <div class="filter-group">
            <label class="text-[10px] font-extrabold text-primary mb-2 block tracking-widest uppercase">JENIS KELAMIN</label>
            <select [ngModel]="filterGender()" (ngModelChange)="filterGender.set($event)" class="custom-select" aria-label="Filter Gender">
              <option value="">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="text-[10px] font-extrabold text-primary mb-2 block tracking-widest uppercase">PEKERJAAN</label>
            <select [ngModel]="filterOccupation()" (ngModelChange)="filterOccupation.set($event)" class="custom-select" aria-label="Filter Pekerjaan">
              <option value="">Semua Pekerjaan</option>
              <option *ngFor="let job of occupationList()" [value]="job">{{ job }}</option>
            </select>
          </div>
          <div class="filter-group ml-auto">
             <label class="text-[10px] font-extrabold text-primary mb-2 block text-right tracking-widest uppercase">TAMPILAN</label>
             <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event); currentPage.set(1)" class="custom-select" style="width: 120px;" aria-label="Jumlah baris per halaman">
                <option [ngValue]="10">10 Baris</option>
                <option [ngValue]="25">25 Baris</option>
                <option [ngValue]="50">50 Baris</option>
             </select>
          </div>
       </div>
    </section>

    <!-- Summary Stats Bar -->
    <section class="grid grid-cols-12 gap-6 mb-8 fade-in" aria-label="Ringkasan Statistik">
       <article class="col-span-4 stat-card card-luxury">
          <div class="flex justify-between items-start mb-4">
            <span class="icon-box azure">📊</span>
            <span class="badge secondary">FILTERED</span>
          </div>
          <div class="value">{{ filteredResidents().length }} <small class="text-sm">Jiwa</small></div>
          <div class="label">Penduduk Terfilter</div>
       </article>
       <article class="col-span-4 stat-card card-luxury">
          <div class="flex justify-between items-start mb-4">
            <span class="icon-box azure">👨</span>
            <span class="badge secondary">LAKI-LAKI</span>
          </div>
          <div class="value">{{ countGender('Laki-laki') }}</div>
          <div class="label">Total Laki-laki</div>
       </article>
       <article class="col-span-4 stat-card card-luxury">
          <div class="flex justify-between items-start mb-4">
            <span class="icon-box azure">👩</span>
            <span class="badge secondary">PEREMPUAN</span>
          </div>
          <div class="value">{{ countGender('Perempuan') }}</div>
          <div class="label">Total Perempuan</div>
       </article>
    </section>

    <main class="card-luxury p-0 overflow-hidden fade-in">
      <table class="luxury-table">
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama Lengkap</th>
            <th>Gender</th>
            <th>Status Dasar</th>
            <th>Hubungan</th>
            <th>No. KK</th>
            <th class="text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of paginatedResidents()" class="table-row-hover">
            <td class="nik-cell">{{ r.nik }}</td>
            <td class="name-cell">
               <div class="font-bold text-slate-800">{{ r.full_name }}</div>
               <div class="text-[10px] text-muted">{{ r.occupation || 'TIDAK TERDEFINISI' }}</div>
            </td>
            <td><span class="text-xs font-bold uppercase">{{ r.gender }}</span></td>
            <td>
              <span class="badge" [class]="r.status_dasar?.toLowerCase() || 'hidup'">
                {{ r.status_dasar || 'HIDUP' }}
              </span>
            </td>
            <td><span class="badge secondary">{{ r.relationship }}</span></td>
            <td><span class="kk-link" (click)="viewFamily(r.family_id)">{{ r.family_id }}</span></td>
            <td class="actions-cell text-right">
              <button class="btn-icon" (click)="viewProfile(r.nik)" title="Lihat Profil" aria-label="Lihat Profil">👁️</button>
              <button class="btn-icon" (click)="editResident(r)" title="Edit" aria-label="Edit Data">✏️</button>
              <button class="btn-icon delete" (click)="deleteResident(r.nik)" title="Hapus" aria-label="Hapus Data">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filteredResidents().length === 0">
            <td colspan="7" class="empty-state">
               <div class="text-4xl mb-4">🔍</div>
               <p>Data penduduk tidak ditemukan.</p>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <footer class="pagination-bar glass-panel p-6 flex-between" *ngIf="filteredResidents().length > 0">
         <div class="pagination-info">
            Menampilkan <b>{{ startIndex() + 1 }}-{{ endIndex() }}</b> dari <b>{{ totalRecords() }}</b> Penduduk
         </div>
         <nav class="pagination-controls flex gap-2" aria-label="Navigasi Halaman">
            <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
               Sebelumnya
            </button>
            <div class="page-numbers flex gap-1">
               <button *ngFor="let p of getVisiblePages()" 
                  class="btn-page-num" 
                  [class.active]="p === currentPage()"
                  (click)="goToPage(p)"
                  [attr.aria-label]="'Halaman ' + p">
                  {{ p }}
               </button>
            </div>
            <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
               Selanjutnya
            </button>
         </nav>
      </footer>
    </main>

    <!-- Modals -->
    <!-- Add Modal -->
    <div *ngIf="isAddModalOpen()" class="form-overlay fade-in" (click)="isAddModalOpen.set(false)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header mb-8">
          <h2 class="title-gradient">Tambah Data Penduduk</h2>
          <p class="text-muted">Masukkan informasi kependudukan sesuai dokumen resmi.</p>
        </header>
        <form (submit)="addNewResident()" class="form-grid">
           <div class="input-group">
              <label>NIK (16 DIGIT)</label>
              <input [(ngModel)]="addForm.nik" name="nik" placeholder="3201..." required minlength="16" maxlength="16" class="custom-input">
           </div>
           <div class="input-group">
              <label>Nama Lengkap</label>
              <input [(ngModel)]="addForm.full_name" name="name" placeholder="Sesuai KTP" required class="custom-input">
           </div>
           <footer class="form-footer mt-8 col-span-2 flex justify-end gap-3">
              <button type="button" class="btn-outline" (click)="isAddModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary" [disabled]="loadingAdd()">
                 {{ loadingAdd() ? 'Sedang Menyimpan...' : 'Simpan Data Penduduk' }}
              </button>
           </footer>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div *ngIf="residentToEdit()" class="form-overlay fade-in" (click)="residentToEdit.set(null)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header mb-8">
          <h2 class="title-gradient">Edit Data: {{ residentToEdit()?.full_name }}</h2>
          <p class="text-muted">Perbarui data kependudukan dengan informasi terbaru.</p>
        </header>
        <form (submit)="updateResident()" class="form-grid">
           <div class="input-group">
              <label>Pekerjaan</label>
              <select [(ngModel)]="editForm.occupation" name="occ" class="custom-select">
                <option *ngFor="let job of staticOccupations" [value]="job">{{ job }}</option>
              </select>
           </div>
           <div class="input-group">
              <label>Status Dasar</label>
              <select [(ngModel)]="editForm.status_dasar" name="status" class="custom-select">
                <option value="HIDUP">HIDUP</option>
                <option value="MATI">MATI</option>
                <option value="PINDAH">PINDAH</option>
              </select>
           </div>
           <footer class="form-footer mt-8 col-span-2 flex justify-end gap-3">
              <button type="button" class="btn-outline" (click)="residentToEdit.set(null)">Batal</button>
              <button type="submit" class="btn-primary">Update Data</button>
           </footer>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: flex-start; }
    .search-bar {
      display: flex; align-items: center; gap: 1rem;
      background: white; border: 1px solid var(--glass-border);
      padding: 0.75rem 1.5rem; border-radius: 1.5rem; width: 450px;
      transition: all 0.4s var(--apple-ease);
      &:focus-within { border-color: var(--primary); box-shadow: 0 10px 25px -10px var(--primary-glow); }
      input { background: none; border: none; color: var(--text-main); width: 100%; outline: none; font-weight: 600; }
      .icon { color: var(--primary); }
    }
    .live-sync-indicator {
      display: flex; align-items: center; gap: 0.5rem;
      .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
      .label { font-size: 0.65rem; font-weight: 800; color: #059669; letter-spacing: 0.1em; }
    }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    
    .stat-card {
      .value { font-size: 2.25rem; font-weight: 800; line-height: 1; margin-bottom: 0.5rem; color: var(--primary); }
      .label { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    }
    .icon-box {
      width: 44px; height: 44px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      &.azure { background: rgba(37, 99, 235, 0.1); }
    }
    .luxury-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      th {
        text-align: left; padding: 1.25rem 1.5rem; color: var(--text-muted);
        font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
        border-bottom: 1px solid var(--glass-border); background: rgba(0,0,0,0.01);
      }
      td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--glass-border); font-size: 0.85rem; }
      .nik-cell { font-family: 'JetBrains Mono', monospace; color: var(--primary); font-weight: 700; }
      .kk-link { color: var(--primary); font-weight: 700; cursor: pointer; border-bottom: 1px dashed var(--primary); }
      .actions-cell { display: flex; gap: 0.5rem; justify-content: flex-end; }
      .btn-icon {
        background: white; border: 1px solid var(--glass-border); width: 36px; height: 36px;
        border-radius: 10px; cursor: pointer; transition: 0.3s var(--apple-ease);
        &:hover { border-color: var(--primary); background: rgba(37, 99, 235, 0.05); transform: translateY(-2px); }
        &.delete:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
      }
    }
    .pagination-bar { background: rgba(255,255,255,0.4); border-top: 1px solid var(--glass-border); }
    .btn-page-num {
       width: 40px; height: 40px; border-radius: 10px; border: 1px solid transparent;
       background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 700;
       cursor: pointer; transition: 0.3s;
       &:hover { background: rgba(0,0,0,0.05); }
       &.active { background: var(--primary); color: white; box-shadow: 0 4px 12px var(--primary-glow); }
    }
    .custom-select, .custom-input {
       background: #f8fafc; border: 1px solid var(--glass-border);
       color: var(--text-main); padding: 0.75rem 1rem; border-radius: 0.85rem; outline: none;
       font-weight: 600; font-size: 0.85rem; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.8); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 900px; padding: 3.5rem; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class ResidentsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private pdfService = inject(PdfService);

  // Constants
  staticOccupations = ['Petani', 'Nelayan', 'Wiraswasta', 'PNS', 'Buruh', 'Karyawan', 'Lainnya'];

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
    });
  });

  paginatedResidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredResidents().slice(start, start + this.pageSize());
  });

  occupationList = computed(() => 
    [...new Set(this.residents().map(r => r.occupation))].filter(Boolean).sort() as string[]
  );

  totalRecords = computed(() => this.filteredResidents().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
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
    if (confirm('Hapus data?')) await this.dataService.deleteResident(n);
  }

  async exportToPdf() {
    await this.pdfService.generateResidentsReport(this.filteredResidents(), 'Laporan Terfilter');
  }
}
