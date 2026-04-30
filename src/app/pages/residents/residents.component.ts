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
        <button class="btn-primary mt-4" (click)="exportToPdf()">
          Ekspor Laporan PDF 📄
        </button>
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

    <!-- Edit Modal -->
    <div *ngIf="residentToEdit()" class="form-overlay" (click)="residentToEdit.set(null)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <h3>Edit Data Penduduk</h3>
        <p class="text-muted mb-4">NIK: {{ residentToEdit()?.nik }}</p>
        
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
              <input [(ngModel)]="editForm.relationship" name="rel">
            </div>
          </div>
          <div class="form-actions mt-6">
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
      width: 450px;
      padding: 2rem;
    }
    .form-grid { display: grid; gap: 1rem; }
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
  residents = signal<Resident[]>([]);
  filteredResidents = signal<Resident[]>([]);
  searchTerm = '';
  filterGender = '';
  filterOccupation = '';
  occupationList: string[] = [];

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
      this.filterResidents(); // Re-apply current filters
      // Extract unique occupations
      this.occupationList = [...new Set(data.map(r => r.occupation))].filter(Boolean).sort();
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

  async updateResident() {
    const original = this.residentToEdit();
    if (!original) return;
    
    await this.dataService.updateResident(this.editForm);
    this.residentToEdit.set(null);
  }

  async deleteResident(nik: string) {
    if (confirm('Apakah Anda yakin ingin menghapus data penduduk ini?')) {
      await this.dataService.deleteResident(nik);
    }
  }

  exportToPdf() {
    let filterTitle = 'Seluruh Wilayah';
    if (this.filterGender || this.filterOccupation || this.searchTerm) {
      filterTitle = `Filer: ${this.filterGender || 'Semua'} | ${this.filterOccupation || 'Semua'} | ${this.searchTerm || '-'}`;
    }
    this.pdfService.generateResidentsReport(this.filteredResidents(), filterTitle);
  }
}
