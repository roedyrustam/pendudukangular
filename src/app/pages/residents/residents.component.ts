import { Component, inject, signal, OnDestroy } from '@angular/core';
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
      </div>
    </div>

    <div class="card-luxury p-0 overflow-hidden">
      <table class="luxury-table">
        <thead>
          <tr>
            <th>NIK</th>
            <th>Nama Lengkap</th>
            <th>Gender</th>
            <th>Hubungan</th>
            <th>No. KK</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of filteredResidents()">
            <td class="nik-cell">{{ r.nik }}</td>
            <td class="name-cell">{{ r.full_name }}</td>
            <td>{{ r.gender }}</td>
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
        &.secondary { background: rgba(99, 102, 241, 0.1); color: #a5b4fc; border: 1px solid rgba(165, 180, 252, 0.2); }
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
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .form-card {
      width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 2rem;
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      label { font-size: 0.8rem; color: var(--text-muted); }
    }
    input, select {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      padding: 0.75rem;
      border-radius: 0.5rem;
      color: white;
      outline: none;
      &:focus { border-color: var(--primary); }
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

  isAddModalOpen = signal(false);
  loadingAdd = signal(false);
  addForm: Partial<Resident> = {
    gender: 'Laki-laki',
    relationship: 'ANAK',
    religion: 'Islam',
    education: 'SLTA / SEDERAJAT'
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
    const gender = this.filterGender;
    const job = this.filterOccupation;

    this.filteredResidents.set(
      this.residents().filter(r => {
        const matchesSearch = r.nik.includes(term) || 
                             r.full_name.toLowerCase().includes(term) ||
                             r.family_id.includes(term);
        const matchesGender = !gender || r.gender === gender;
        const matchesJob = !job || r.occupation === job;
        return matchesSearch && matchesGender && matchesJob;
      })
    );
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
        education: 'SLTA / SEDERAJAT'
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
