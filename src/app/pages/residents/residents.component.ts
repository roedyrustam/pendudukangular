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
    <div class="header-actions mb-6">
      <div class="titles">
        <h2 class="title-gradient">Data Penduduk Terpadu</h2>
        <p class="text-muted">Manajemen data individu berbasis NIK seluruh wilayah</p>
        <div class="flex gap-2 mt-4">
          <button class="btn-primary" (click)="isAddModalOpen.set(true)">
            Tambah Penduduk ➕
          </button>
          <button class="btn-outline" (click)="exportToPdf()">
            Ekspor Laporan PDF 📄
          </button>
        </div>
      </div>
      <div class="search-filter glass-panel">
        <span class="icon">🔍</span>
        <input [(ngModel)]="searchTerm" (input)="filterResidents()" placeholder="Cari NIK atau Nama...">
      </div>
      <div class="filters-row glass-panel mt-4">
        <div class="filter-group">
          <label>Gender</label>
          <select [(ngModel)]="filterGender" (change)="filterResidents()">
            <option value="">Semua Gender</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Pekerjaan</label>
          <select [(ngModel)]="filterOccupation" (change)="filterResidents()">
            <option value="">Semua Pekerjaan</option>
            <option *ngFor="let job of occupationList" [value]="job">{{ job }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Dusun</label>
          <select [(ngModel)]="filterHamlet" (change)="filterResidents()">
            <option value="">Semua Dusun</option>
            <option value="Dusun I">Dusun I</option>
            <option value="Dusun II">Dusun II</option>
            <option value="Dusun III">Dusun III</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Status Dasar</label>
          <select [(ngModel)]="filterStatus" (change)="filterResidents()">
            <option value="">Semua Status</option>
            <option value="HIDUP">HIDUP</option>
            <option value="MATI">MATI</option>
            <option value="PINDAH">PINDAH</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Summary Stats Bar -->
    <div class="stats-bar mb-6">
       <div class="stat-item card-luxury">
          <label>Total Terfilter</label>
          <span class="value">{{ filteredResidents().length }} Jiwa</span>
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

    <div class="card-luxury p-0 overflow-hidden">
      <table class="luxury-table">
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama Lengkap</th>
            <th>Gender</th>
            <th>Status</th>
            <th>Hubungan</th>
            <th>No. KK</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of paginatedResidents()" class="fade-in">
            <td class="nik-cell">{{ r.nik }}</td>
            <td class="name-cell">{{ r.full_name }}</td>
            <td>{{ r.gender }}</td>
            <td>
              <span class="badge" [class]="r.status_dasar?.toLowerCase() || 'hidup'">
                {{ r.status_dasar || 'HIDUP' }}
              </span>
            </td>
            <td><span class="badge secondary">{{ r.relationship }}</span></td>
            <td><span class="kk-link">{{ r.family_id }}</span></td>
            <td class="actions-cell">
              <button class="btn-icon" (click)="viewProfile(r.nik)" title="Lihat Profil">👁️</button>
              <button class="btn-icon" (click)="editResident(r)" title="Edit">✏️</button>
              <button class="btn-icon delete" (click)="deleteResident(r.nik)" title="Hapus">🗑️</button>
            </td>
          </tr>
          <tr *ngIf="filteredResidents().length === 0">
            <td colspan="6" class="empty-state">Data tidak ditemukan.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Controls -->
      <div class="pagination-container" *ngIf="filteredResidents().length > pageSize()">
        <div class="pagination-info">
          Menampilkan {{ startRange() }} - {{ endRange() }} dari {{ filteredResidents().length }} Penduduk
        </div>
        <div class="pagination-controls">
          <button (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">Prev</button>
          <button *ngFor="let p of totalPagesArray()" 
                  (click)="goToPage(p)" 
                  [class.active]="currentPage() === p">
            {{ p }}
          </button>
          <button (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">Next</button>
        </div>
      </div>
    </div>

    <!-- Add Modal -->
    <div *ngIf="isAddModalOpen()" class="form-overlay" (click)="isAddModalOpen.set(false)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header mb-6">
          <h3 class="title-gradient">Tambah Data Penduduk Baru</h3>
          <p class="text-muted">Masukkan informasi lengkap sesuai dokumen KTP/KK.</p>
        </div>
        
        <form (submit)="addNewResident()">
          <div class="form-grid">
            <div class="input-group">
              <label>NIK (16 Digit)</label>
              <input [(ngModel)]="addForm.nik" name="nik" placeholder="Contoh: 320101XXXXXXXXXX" required minlength="16" maxlength="16">
            </div>
            <div class="input-group">
              <label>Nama Lengkap</label>
              <input [(ngModel)]="addForm.full_name" name="name" placeholder="Nama sesuai identitas" required>
            </div>
            <div class="input-group">
              <label>Nomor KK</label>
              <select [(ngModel)]="addForm.family_id" name="kk" required>
                <option value="">-- Pilih Kartu Keluarga --</option>
                <option *ngFor="let f of families()" [value]="f.kk_number">{{ f.kk_number }} - {{ f.head_of_family_name }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Gender</label>
              <select [(ngModel)]="addForm.gender" name="gender" required>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div class="input-group">
              <label>Tempat Lahir</label>
              <input [(ngModel)]="addForm.birth_place" name="birth_place" placeholder="Contoh: Jakarta">
            </div>
            <div class="input-group">
              <label>Tanggal Lahir</label>
              <input type="date" [(ngModel)]="addForm.birth_date" name="birth_date" required>
            </div>
            <div class="input-group">
              <label>Pekerjaan</label>
              <select [(ngModel)]="addForm.occupation" name="job">
                <option *ngFor="let job of occupationList" [value]="job">{{ job }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Hubungan Keluarga</label>
              <select [(ngModel)]="addForm.relationship" name="rel" required>
                <option *ngFor="let r of relationshipList" [value]="r">{{ r }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Agama</label>
              <select [(ngModel)]="addForm.religion" name="religion">
                <option *ngFor="let r of religionList" [value]="r">{{ r }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Pendidikan</label>
              <select [(ngModel)]="addForm.education" name="education">
                <option *ngFor="let e of educationList" [value]="e">{{ e }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Status Dasar</label>
              <select [(ngModel)]="addForm.status_dasar" name="status_dasar">
                <option value="HIDUP">HIDUP</option>
                <option value="MATI">MATI</option>
                <option value="PINDAH">PINDAH</option>
              </select>
            </div>
            <div class="input-group">
              <label>Dusun / Lingkungan</label>
              <input [(ngModel)]="addForm.hamlet" name="hamlet" placeholder="Nama Dusun">
            </div>
            <div class="input-group">
              <label>RT</label>
              <input [(ngModel)]="addForm.rt" name="rt" placeholder="001">
            </div>
            <div class="input-group">
              <label>RW</label>
              <input [(ngModel)]="addForm.rw" name="rw" placeholder="005">
            </div>
          </div>
          <div class="form-actions mt-8">
            <button type="button" class="btn-text" (click)="isAddModalOpen.set(false)">Batal</button>
            <button type="submit" class="btn-primary" [disabled]="loadingAdd()">
              {{ loadingAdd() ? 'Menyimpan...' : 'Simpan Data Penduduk' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Edit Modal -->
    <div *ngIf="residentToEdit()" class="form-overlay" (click)="residentToEdit.set(null)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <div class="modal-header mb-6">
          <h3 class="title-gradient">Edit Data Penduduk</h3>
          <p class="text-muted">NIK: {{ residentToEdit()?.nik }}</p>
        </div>
        
        <form (submit)="updateResident()">
          <div class="form-grid">
            <div class="input-group">
              <label>Nama Lengkap</label>
              <input [(ngModel)]="editForm.full_name" name="name" required>
            </div>
            <div class="input-group">
              <label>Pekerjaan</label>
              <input [(ngModel)]="editForm.occupation" name="job">
            </div>
            <div class="input-group">
              <label>Gender</label>
              <select [(ngModel)]="editForm.gender" name="gender">
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div class="input-group">
              <label>Hubungan</label>
              <select [(ngModel)]="editForm.relationship" name="rel">
                <option *ngFor="let r of relationshipList" [value]="r">{{ r }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Agama</label>
              <select [(ngModel)]="editForm.religion" name="religion">
                <option *ngFor="let r of religionList" [value]="r">{{ r }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Pendidikan</label>
              <select [(ngModel)]="editForm.education" name="education">
                <option *ngFor="let e of educationList" [value]="e">{{ e }}</option>
              </select>
            </div>
            <div class="input-group">
              <label>Status Kawin</label>
              <select [(ngModel)]="editForm.marital_status" name="marital_status">
                <option value="Belum Kawin">Belum Kawin</option>
                <option value="Kawin">Kawin</option>
                <option value="Cerai Hidup">Cerai Hidup</option>
                <option value="Cerai Mati">Cerai Mati</option>
              </select>
            </div>
            <div class="input-group">
              <label>Golongan Darah</label>
              <select [(ngModel)]="editForm.blood_type" name="blood_type">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="-">Tidak Tahu</option>
              </select>
            </div>
            <div class="input-group">
              <label>Kewarganegaraan</label>
              <select [(ngModel)]="editForm.citizenship" name="citizenship">
                <option value="WNI">WNI</option>
                <option value="WNA">WNA</option>
              </select>
            </div>
            <div class="input-group">
              <label>Nama Ayah</label>
              <input [(ngModel)]="editForm.father_name" name="father_name">
            </div>
            <div class="input-group">
              <label>Nama Ibu</label>
              <input [(ngModel)]="editForm.mother_name" name="mother_name">
            </div>
            <div class="input-group" style="grid-column: 1 / -1;">
              <label>Alamat Lengkap</label>
              <input [(ngModel)]="editForm.address" name="address">
            </div>
            <div class="input-group">
              <label>Status Dasar</label>
              <select [(ngModel)]="editForm.status_dasar" name="status_dasar">
                <option value="HIDUP">HIDUP</option>
                <option value="MATI">MATI</option>
                <option value="PINDAH">PINDAH</option>
              </select>
            </div>
            <div class="input-group">
              <label>Dusun</label>
              <input [(ngModel)]="editForm.hamlet" name="hamlet">
            </div>
            <div class="input-group">
              <label>RT</label>
              <input [(ngModel)]="editForm.rt" name="rt">
            </div>
            <div class="input-group">
              <label>RW</label>
              <input [(ngModel)]="editForm.rw" name="rw">
            </div>
          </div>
          <div class="form-actions mt-8">
            <button type="button" class="btn-text" (click)="residentToEdit.set(null)">Batal</button>
            <button type="submit" class="btn-primary">Simpan Perubahan</button>
          </div>
        </form>
      </div>
    </div>
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
