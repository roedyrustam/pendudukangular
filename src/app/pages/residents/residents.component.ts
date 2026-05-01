import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { Resident } from '../../models/data.models';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-residents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions mb-8 fade-in">
      <div class="titles">
        <h2 class="title-gradient">Data Penduduk Terpadu</h2>
        <p class="text-muted">Manajemen data individu berbasis NIK seluruh wilayah</p>
        <div class="flex gap-3 mt-6">
          <button class="btn-primary" (click)="isAddModalOpen.set(true)">
             Tambah Penduduk ➕
          </button>
          <button class="btn-outline" (click)="exportToPdf()">
             Ekspor Laporan PDF 📄
          </button>
        </div>
      </div>

      <div class="header-right">
        <div class="search-filter glass-panel mb-4">
          <span class="icon">🔍</span>
          <input [(ngModel)]="searchTerm" (input)="filterResidents()" placeholder="Cari NIK atau Nama...">
        </div>
        <div class="live-sync-indicator ml-auto">
          <div class="pulse-dot"></div>
          <span class="label">LIVE DATA SYNC</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filters-container card-luxury mb-8 p-6 fade-in">
       <div class="flex gap-6 flex-wrap items-center">
          <div class="filter-group">
            <label class="text-xs font-bold text-primary mb-2 block">JENIS KELAMIN</label>
            <select [(ngModel)]="filterGender" (change)="filterResidents()" class="custom-select">
              <option value="">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="text-xs font-bold text-primary mb-2 block">PEKERJAAN</label>
            <select [(ngModel)]="filterOccupation" (change)="filterResidents()" class="custom-select">
              <option value="">Semua Pekerjaan</option>
              <option *ngFor="let job of occupationList" [value]="job">{{ job }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="text-xs font-bold text-primary mb-2 block">WILAYAH (DUSUN)</label>
            <select [(ngModel)]="filterHamlet" (change)="filterResidents()" class="custom-select">
              <option value="">Semua Dusun</option>
              <option value="Dusun I">Dusun I</option>
              <option value="Dusun II">Dusun II</option>
              <option value="Dusun III">Dusun III</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="text-xs font-bold text-primary mb-2 block">STATUS</label>
            <select [(ngModel)]="filterStatus" (change)="filterResidents()" class="custom-select">
              <option value="">Semua Status</option>
              <option value="HIDUP">HIDUP</option>
              <option value="MATI">MATI</option>
              <option value="PINDAH">PINDAH</option>
            </select>
          </div>
          <div class="filter-group ml-auto">
             <label class="text-xs font-bold text-primary mb-2 block text-right">BARIS</label>
             <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event); currentPage.set(1)" class="custom-select" style="width: 80px;">
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
                <option [ngValue]="100">100</option>
             </select>
          </div>
       </div>
    </div>

    <!-- Summary Stats Bar -->
    <div class="stats-bar mb-8 fade-in">
       <div class="stat-item card-luxury">
          <label>Total Terfilter</label>
          <span class="value">{{ filteredResidents().length }} <small>Jiwa</small></span>
       </div>
       <div class="stat-item card-luxury">
          <label>Laki-laki</label>
          <span class="value">{{ countGender('Laki-laki') }}</span>
       </div>
       <div class="stat-item card-luxury">
          <label>Perempuan</label>
          <span class="value">{{ countGender('Perempuan') }}</span>
       </div>
    </div>

    <div class="card-luxury p-0 overflow-hidden fade-in">
      <table class="luxury-table">
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama Lengkap</th>
            <th>Gender</th>
            <th>Status</th>
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
            <td><span class="text-xs font-bold">{{ r.gender }}</span></td>
            <td>
              <span class="badge" [class]="r.status_dasar?.toLowerCase() || 'hidup'">
                {{ r.status_dasar || 'HIDUP' }}
              </span>
            </td>
            <td><span class="badge secondary">{{ r.relationship }}</span></td>
            <td><span class="kk-link" (click)="viewFamily(r.family_id)">{{ r.family_id }}</span></td>
            <td class="actions-cell text-right">
              <button class="btn-icon" (click)="viewProfile(r.nik)" title="Lihat Profil">👁️</button>
              <button class="btn-icon" (click)="editResident(r)" title="Edit">✏️</button>
              <button class="btn-icon delete" (click)="deleteResident(r.nik)" title="Hapus">🗑️</button>
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
      <div class="pagination-bar glass-panel p-6 flex-between" *ngIf="filteredResidents().length > 0">
         <div class="pagination-info">
            Menampilkan <b>{{ startIndex() + 1 }}-{{ endIndex() }}</b> dari <b>{{ totalRecords() }}</b> Penduduk
         </div>
         <div class="pagination-controls flex gap-2">
            <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
               Sebelumnya
            </button>
            <div class="page-numbers flex gap-1">
               <button *ngFor="let p of getVisiblePages()" 
                  class="btn-page-num" 
                  [class.active]="p === currentPage()"
                  (click)="goToPage(p)">
                  {{ p }}
               </button>
            </div>
            <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
               Selanjutnya
            </button>
         </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div *ngIf="isAddModalOpen()" class="form-overlay fade-in" (click)="isAddModalOpen.set(false)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header mb-8">
          <h2 class="title-gradient">Tambah Data Penduduk</h2>
          <p class="text-muted">Masukkan informasi kependudukan sesuai dokumen resmi.</p>
        </div>
        
        <form (submit)="addNewResident()" class="form-grid">
           <div class="input-group">
              <label>NIK (16 DIGIT)</label>
              <input [(ngModel)]="addForm.nik" name="nik" placeholder="3201..." required minlength="16" maxlength="16" class="custom-input">
           </div>
           <div class="input-group">
              <label>Nama Lengkap</label>
              <input [(ngModel)]="addForm.full_name" name="name" placeholder="Sesuai KTP" required class="custom-input">
           </div>
           <div class="form-footer mt-8 col-span-2 flex justify-end gap-3">
              <button type="button" class="btn-outline" (click)="isAddModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary" [disabled]="loadingAdd()">
                 {{ loadingAdd() ? 'Sedang Menyimpan...' : 'Simpan Data Penduduk' }}
              </button>
           </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-right { display: flex; flex-direction: column; align-items: flex-end; }
    .search-filter {
      display: flex; align-items: center; gap: 1rem;
      background: white; border: 1px solid var(--glass-border);
      padding: 0.8rem 1.5rem; border-radius: 1.5rem; width: 450px;
      input { background: none; border: none; color: var(--text-main); width: 100%; outline: none; font-weight: 500; }
      .icon { color: var(--primary); }
    }
    .live-sync-indicator {
      display: flex; align-items: center; gap: 0.5rem;
      .pulse-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; animation: pulse 2s infinite; }
      .label { font-size: 0.65rem; font-weight: 800; color: #059669; letter-spacing: 0.1em; }
    }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    
    .stats-bar {
       display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
       .stat-item {
          padding: 1.5rem;
          label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; }
          .value { font-size: 1.8rem; font-weight: 900; color: var(--primary); small { font-size: 0.8rem; opacity: 0.5; } }
       }
    }
    .btn-page-num {
       width: 38px; height: 38px; border-radius: 0.8rem; border: 1px solid transparent;
       background: transparent; color: var(--text-muted); font-size: 0.85rem; font-weight: 700;
       cursor: pointer; transition: 0.3s;
       &:hover { background: rgba(0,0,0,0.05); color: var(--text-main); }
       &.active { background: var(--primary); color: white; box-shadow: 0 4px 12px var(--primary-glow); }
    }
    .custom-select, .custom-input {
       background: rgba(0,0,0,0.03); border: 1px solid var(--glass-border);
       color: var(--text-main); padding: 0.75rem 1rem; border-radius: 0.75rem; outline: none;
       font-weight: 600; font-size: 0.85rem; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    }
    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.8); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 900px; padding: 3.5rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.7rem; font-weight: 800; color: var(--primary); text-transform: uppercase; } }
    .empty-state { text-align: center; padding: 6rem; color: var(--text-muted); }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .col-span-2 { grid-column: span 2; }
  `]
})
export class ResidentsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private pdfService = inject(PdfService);

  occupationList = [
    'Petani', 'Nelayan', 'Wiraswasta', 'PNS', 'TNI/Polri', 'Karyawan Swasta', 
    'Buruh', 'Pelajar/Mahasiswa', 'Ibu Rumah Tangga', 'Tidak/Belum Bekerja', 'Pensiunan'
  ];

  religionList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

  educationList = [
    'TIDAK / BELUM SEKOLAH', 'BELUM TAMAT SD/SEDERAJAT', 'TAMAT SD / SEDERAJAT',
    'SLTP/SEDERAJAT', 'SLTA / SEDERAJAT', 'DIPLOMA I / II',
    'AKADEMI/ DIPLOMA III/S. MUDA', 'DIPLOMA IV/ STRATA I', 'STRATA II', 'STRATA III'
  ];

  relationshipList = [
    'KEPALA KELUARGA', 'SUAMI', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 
    'ORANG TUA', 'MERTUA', 'FAMILI LAIN', 'PEMBANTU', 'LAINNYA'
  ];

  residents = signal<Resident[]>([]);
  families = signal<any[]>([]);
  filteredResidents = signal<Resident[]>([]);
  searchTerm = '';
  filterGender = '';
  filterOccupation = '';
  filterHamlet = '';
  filterStatus = '';

  currentPage = signal(1);
  pageSize = signal(10);

  paginatedResidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredResidents().slice(start, end);
  });

  totalRecords = computed(() => this.filteredResidents().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalRecords()));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (current >= total - 3) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }
    return pages;
  }

  isAddModalOpen = signal(false);
  loadingAdd = signal(false);
  addForm: Partial<Resident> = {
    gender: 'Laki-laki',
    relationship: 'ANAK',
    religion: 'Islam',
    education: 'SLTA / SEDERAJAT',
    status_dasar: 'HIDUP'
  };

  residentToEdit = signal<Resident | null>(null);
  editForm: any = {};
  private subscriptions: any[] = [];

  constructor() {
    this.refreshData();
    this.subscriptions.push(this.dataService.subscribeToResidents(() => this.refreshData()));
  }

  refreshData() {
    this.dataService.getResidents().subscribe(data => {
      this.residents.set(data);
      this.filterResidents(); 
      this.occupationList = [...new Set(data.map(r => r.occupation))].filter(Boolean).sort();
    });
    this.dataService.getFamilies().subscribe(data => this.families.set(data));
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  filterResidents() {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.residents().filter(r => {
      let matches = true;
      const searchStr = (r.nik + (r.full_name || '') + (r.family_id || '')).toLowerCase();
      if (term && !searchStr.includes(term)) matches = false;
      if (this.filterGender && r.gender !== this.filterGender) matches = false;
      if (this.filterOccupation && r.occupation !== this.filterOccupation) matches = false;
      if (this.filterHamlet && r.hamlet !== this.filterHamlet) matches = false;
      if (this.filterStatus && (r.status_dasar || 'HIDUP') !== this.filterStatus) matches = false;
      return matches;
    });
    this.filteredResidents.set(filtered);
    this.currentPage.set(1);
  }

  countGender(gender: string): number {
    return this.filteredResidents().filter(r => r.gender === gender).length;
  }

  viewProfile(nik: string) { this.router.navigate(['/residents', nik]); }
  viewFamily(kk: string) { this.router.navigate(['/families'], { queryParams: { search: kk } }); }

  editResident(resident: Resident) {
    this.residentToEdit.set(resident);
    this.editForm = { ...resident };
  }

  async addNewResident() {
    if (!this.addForm.nik || !this.addForm.full_name || !this.addForm.family_id) {
      alert('NIK, Nama Lengkap, dan No. KK wajib diisi.');
      return;
    }
    this.loadingAdd.set(true);
    try {
      await this.dataService.addResident(this.addForm as Resident);
      this.isAddModalOpen.set(false);
      this.addForm = { gender: 'Laki-laki', relationship: 'ANAK', religion: 'Islam', education: 'SLTA / SEDERAJAT', status_dasar: 'HIDUP' };
    } catch (err: any) { alert('Gagal menambah penduduk: ' + err.message); } 
    finally { this.loadingAdd.set(false); }
  }

  async updateResident() {
    try { await this.dataService.updateResident(this.editForm); this.residentToEdit.set(null); } 
    catch (err: any) { alert('Gagal memperbarui data: ' + err.message); }
  }

  async deleteResident(nik: string) {
    if (confirm('Apakah Anda yakin ingin menghapus data penduduk ini?')) {
      await this.dataService.deleteResident(nik);
    }
  }

  async exportToPdf() {
    const filterTitle = `Data Kependudukan - Terfilter: ${this.filteredResidents().length} Jiwa`;
    await this.pdfService.generateResidentsReport(this.filteredResidents(), filterTitle);
  }
}
  `,
  styles: [`
    .header-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .modal-header h3 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 0.85rem 1.75rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      &:hover { background: rgba(255,255,255,0.05); color: #fff; border-color: #fff; }
    }
    .search-filter {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      border-radius: 2rem;
      width: 400px;
      input {
        background: none;
        border: none;
        color: white;
        width: 100%;
        outline: none;
        font-family: inherit;
        &::placeholder { color: var(--text-muted); }
      }
    }
    .filters-row {
      display: flex;
      gap: 2rem;
      padding: 0.75rem 1.5rem;
      border-radius: 1rem;
      margin-top: 1rem;
      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
        select {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: white;
          padding: 0.3rem 0.6rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          outline: none;
          &:focus { border-color: var(--primary); }
        }
      }
    }
    .stats-bar {
       display: grid;
       grid-template-columns: repeat(3, 1fr);
       gap: 1.5rem;
       .stat-item {
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.25rem; }
          .value { font-size: 1.5rem; font-weight: 800; color: var(--primary); }
       }
    }
    .luxury-table {
      width: 100%;
      border-collapse: collapse;
      th {
        text-align: left;
        padding: 1.25rem 1.5rem;
        color: var(--text-muted);
        font-weight: 500;
        font-size: 0.85rem;
        background: rgba(255,255,255,0.02);
        border-bottom: 1px solid var(--border-color);
      }
      td {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--border-color);
        font-size: 0.9rem;
      }
      tr:hover td { background: rgba(255,255,255,0.01); }
      .nik-cell { color: var(--primary); font-weight: 600; font-family: 'Courier New', Courier, monospace; }
      .name-cell { font-weight: 500; }
      .kk-link { color: #818cf8; text-decoration: underline; cursor: pointer; }
      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        &.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        &.diproses { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        &.selesai { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        &.hidup { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
        &.mati { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
        &.pindah { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
      }
      .actions-cell {
        display: flex;
        gap: 0.5rem;
      }
      .btn-icon {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-color);
        padding: 0.4rem;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: rgba(255,255,255,0.1); border-color: var(--primary); }
        &.delete:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
      }
      .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); }
    }
    .form-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .form-card {
      width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; padding: 3rem;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .input-group {
      display: flex; flex-direction: column; gap: 0.5rem;
      label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    }
    input, select {
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
      color: white; padding: 0.85rem 1rem; border-radius: 0.75rem; outline: none;
      transition: all 0.2s;
      &:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); box-shadow: 0 0 15px rgba(99,102,241,0.2); }
    }
    select {
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 1rem center;
      background-size: 1.2em;
      padding-right: 3rem !important;
      cursor: pointer;
    }
    select option { 
      background-color: #0f172a !important; 
      color: white !important;
      padding: 1rem;
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .p-0 { padding: 0 !important; }
    .overflow-hidden { overflow: hidden; }
  `]
})
export class ResidentsComponent implements OnDestroy {
  private dataService = inject(DataService);
  private router = inject(Router);
  private pdfService = inject(PdfService);
  occupationList = [
    'Petani', 'Nelayan', 'Wiraswasta', 'PNS', 'TNI/Polri', 'Karyawan Swasta', 
    'Buruh', 'Pelajar/Mahasiswa', 'Ibu Rumah Tangga', 'Tidak/Belum Bekerja', 'Pensiunan'
  ];

  religionList = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

  educationList = [
    'TIDAK / BELUM SEKOLAH', 'BELUM TAMAT SD/SEDERAJAT', 'TAMAT SD / SEDERAJAT',
    'SLTP/SEDERAJAT', 'SLTA / SEDERAJAT', 'DIPLOMA I / II',
    'AKADEMI/ DIPLOMA III/S. MUDA', 'DIPLOMA IV/ STRATA I', 'STRATA II', 'STRATA III'
  ];

  relationshipList = [
    'KEPALA KELUARGA', 'SUAMI', 'ISTRI', 'ANAK', 'MENANTU', 'CUCU', 
    'ORANG TUA', 'MERTUA', 'FAMILI LAIN', 'PEMBANTU', 'LAINNYA'
  ];

  residents = signal<Resident[]>([]);
  families = signal<any[]>([]);
  filteredResidents = signal<Resident[]>([]);
  searchTerm = '';
  filterGender = '';
  filterOccupation = '';
  filterHamlet = '';
  filterStatus = '';

  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(10);

  paginatedResidents = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredResidents().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.filteredResidents().length / this.pageSize()));
  totalPagesArray = computed(() => {
    const pages = this.totalPages();
    const current = this.currentPage();
    // Simple pagination logic to show max 5 pages
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  });

  startRange = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endRange = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredResidents().length));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  isAddModalOpen = signal(false);
  loadingAdd = signal(false);
  addForm: Partial<Resident> = {
    gender: 'Laki-laki',
    relationship: 'ANAK',
    religion: 'Islam',
    education: 'SLTA / SEDERAJAT',
    status_dasar: 'HIDUP'
  };

  residentToEdit = signal<Resident | null>(null);
  editForm: any = {};
  private subscriptions: any[] = [];

  constructor() {
    this.refreshData();

    // Realtime Subscriptions
    this.subscriptions.push(
      this.dataService.subscribeToResidents(() => this.refreshData())
    );
  }

  refreshData() {
    this.dataService.getResidents().subscribe(data => {
      this.residents.set(data);
      this.filterResidents(); 
      this.occupationList = [...new Set(data.map(r => r.occupation))].filter(Boolean).sort();
    });

    this.dataService.getFamilies().subscribe(data => {
      this.families.set(data);
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  filterResidents() {
    const term = this.searchTerm.toLowerCase();
    const filtered = this.residents().filter(r => {
      let matches = true;
      const searchStr = (r.nik + r.full_name + r.family_id).toLowerCase();
      if (term && !searchStr.includes(term)) matches = false;
      if (this.filterGender && r.gender !== this.filterGender) matches = false;
      if (this.filterOccupation && r.occupation !== this.filterOccupation) matches = false;
      if (this.filterHamlet && r.hamlet !== this.filterHamlet) matches = false;
      if (this.filterStatus && (r.status_dasar || 'HIDUP') !== this.filterStatus) matches = false;
      return matches;
    });
    this.filteredResidents.set(filtered);
    this.currentPage.set(1); // Reset to first page on filter
  }

  countGender(gender: string): number {
    return this.filteredResidents().filter(r => r.gender === gender).length;
  }

  viewProfile(nik: string) {
    this.router.navigate(['/residents', nik]);
  }

  editResident(resident: Resident) {
    this.residentToEdit.set(resident);
    this.editForm = { ...resident };
  }

  async addNewResident() {
    if (!this.addForm.nik || !this.addForm.full_name || !this.addForm.family_id) {
      alert('NIK, Nama Lengkap, dan No. KK wajib diisi.');
      return;
    }
    
    this.loadingAdd.set(true);
    try {
      await this.dataService.addResident(this.addForm as Resident);
      this.isAddModalOpen.set(false);
      this.addForm = {
        gender: 'Laki-laki',
        relationship: 'ANAK',
        religion: 'Islam',
        education: 'SLTA / SEDERAJAT',
        status_dasar: 'HIDUP'
      };
    } catch (err: any) {
      alert('Gagal menambah penduduk: ' + err.message);
    } finally {
      this.loadingAdd.set(false);
    }
  }

  async updateResident() {
    const original = this.residentToEdit();
    if (!original) return;
    
    try {
      await this.dataService.updateResident(this.editForm);
      this.residentToEdit.set(null);
    } catch (err: any) {
      alert('Gagal memperbarui data: ' + err.message);
    }
  }

  async deleteResident(nik: string) {
    if (confirm('Apakah Anda yakin ingin menghapus data penduduk ini?')) {
      await this.dataService.deleteResident(nik);
    }
  }

  async exportToPdf() {
    let filterTitle = 'Seluruh Wilayah';
    if (this.filterGender || this.filterOccupation || this.searchTerm) {
      filterTitle = `Filer: ${this.filterGender || 'Semua'} | ${this.filterOccupation || 'Semua'} | ${this.searchTerm || '-'}`;
    }
    await this.pdfService.generateResidentsReport(this.filteredResidents(), filterTitle);
  }
}
