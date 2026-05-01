import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { RegionService } from '../../services/region.service';
import { Family, Resident, VillageConfig } from '../../models/data.models';
import { FormsModule } from '@angular/forms';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-families',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions mb-6">
      <h2 class="title-gradient">Manajemen Kartu Keluarga</h2>
      <button class="btn-primary" (click)="showAddFamily.set(true)">Tambah KK Baru</button>
    </div>

    <!-- Modal Form KK Baru / Edit -->
    <div *ngIf="showAddFamily() || familyToEdit()" class="form-overlay" (click)="closeFamilyForm()">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <h3>{{ familyToEdit() ? 'Update Data' : 'Registrasi' }} Kartu Keluarga</h3>
        <form (submit)="saveFamily()">
          <div class="form-grid">
            <div class="input-group">
              <label>Nomor KK</label>
              <input [(ngModel)]="familyForm.kk_number" name="kk" placeholder="16 digit nomor KK" required [disabled]="!!familyToEdit()">
            </div>
            <div class="input-group">
              <label>NIK Kepala Keluarga</label>
              <input [(ngModel)]="familyForm.head_of_family_nik" name="head_nik" placeholder="16 digit NIK">
            </div>
            <div class="input-group">
              <label>Kepala Keluarga</label>
              <input [(ngModel)]="familyForm.head_of_family_name" name="head" placeholder="Nama lengkap" required>
            </div>
            <div class="input-group" style="grid-column: 1 / -1;">
              <label>Alamat Lengkap</label>
              <input [(ngModel)]="familyForm.address" name="addr" placeholder="Jalan / Perumahan" required>
            </div>
            <div class="input-group">
              <label>RT</label>
              <input [(ngModel)]="familyForm.rt" name="rt" placeholder="001">
            </div>
            <div class="input-group">
              <label>RW</label>
              <input [(ngModel)]="familyForm.rw" name="rw" placeholder="002">
            </div>
            <div class="input-group">
              <label>Dusun</label>
              <input [(ngModel)]="familyForm.hamlet" name="hamlet" placeholder="Dusun">
            </div>
            <div class="input-group">
              <label>Kecamatan</label>
              <input [(ngModel)]="familyForm.district" name="dist" placeholder="Kecamatan" required>
            </div>
            <div class="input-group">
              <label>Kelas Sosial</label>
              <select [(ngModel)]="familyForm.social_class" name="social_class">
                <option value="Sangat Miskin">Sangat Miskin</option>
                <option value="Miskin">Miskin</option>
                <option value="Sedang">Sedang</option>
                <option value="Kaya">Kaya</option>
              </select>
            </div>
            <div class="input-group">
              <label>Tanggal Cetak KK</label>
              <input type="date" [(ngModel)]="familyForm.print_date" name="print_date">
            </div>
          </div>
          <div class="form-actions mt-6">
            <button type="button" class="btn-text" (click)="closeFamilyForm()">Batal</button>
            <button type="submit" class="btn-primary">{{ familyToEdit() ? 'Simpan Perubahan' : 'Simpan Data' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Form Detail & Anggota -->
    <div *ngIf="selectedFamily()" class="form-overlay" (click)="selectedFamily.set(null)">
      <div class="form-card card-luxury glass-panel wide" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <div class="titles">
            <h3>Detail Keluarga: {{ selectedFamily()?.head_of_family_name }}</h3>
            <p class="text-muted">KK: {{ selectedFamily()?.kk_number }}</p>
          </div>
          <button class="btn-outline btn-sm" (click)="downloadFamilyPDF()">🖨️ Cetak Profil Keluarga</button>
        </header>

        <section class="resident-section mt-6">
          <div class="section-header">
            <h4>Daftar Anggota Keluarga</h4>
            <button class="btn-sm btn-primary" (click)="showAddResident.set(true)">+ Tambah Anggota</button>
          </div>

          <div class="members-list mt-4">
             <div *ngFor="let r of members()" class="member-item">
               <span class="nik">{{ r.nik }}</span>
               <span class="name">{{ r.full_name }}</span>
               <span class="rel badge">{{ r.relationship }}</span>
               <button class="btn-delete-sm" (click)="deleteMember(r.nik)">🗑️</button>
             </div>
             <p *ngIf="members().length === 0" class="text-muted py-4">Belum ada anggota terdaftar.</p>
          </div>
        </section>

        <!-- Nested Add Resident Form -->
        <div *ngIf="showAddResident()" class="add-resident-box card-luxury mt-4">
          <h5>Input Anggota Keluarga Baru</h5>
          <div class="form-grid-3 mt-2">
            <input [(ngModel)]="newResident.nik" placeholder="NIK (16 digit)">
            <input [(ngModel)]="newResident.full_name" placeholder="Nama Lengkap">
            <select [(ngModel)]="newResident.gender">
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
            <input [(ngModel)]="newResident.relationship" placeholder="Hubungan (Anak, Istri, dll)">
            <input [(ngModel)]="newResident.occupation" placeholder="Pekerjaan">
          </div>
          <div class="mt-4 flex gap-2">
             <button class="btn-sm btn-primary" (click)="saveResident()">Simpan Anggota</button>
             <button class="btn-sm btn-text" (click)="showAddResident.set(false)">Batal</button>
          </div>
        </div>

        <div class="form-actions mt-6">
          <button class="btn-primary" (click)="selectedFamily.set(null)">Tutup</button>
        </div>
      </div>
    </div>

    <!-- List KK -->
    <div class="families-grid">
      <div *ngFor="let f of paginatedFamilies()" class="card-luxury family-card">
        <div class="card-header">
          <div class="icon">🏠</div>
          <div class="head-info">
            <h4>{{ f.head_of_family_name }}</h4>
            <p>{{ f.kk_number }}</p>
          </div>
          <div class="card-actions">
            <button class="btn-icon" (click)="editFamily(f)" title="Edit">✏️</button>
            <button class="btn-icon delete" (click)="deleteFamily(f.kk_number)" title="Hapus">🗑️</button>
          </div>
        </div>
        <div class="card-body">
          <p class="address">{{ f.address }}</p>
          <div class="card-meta">
            <span class="sub">{{ f.district }}</span>
            <span class="member-badge">{{ getMemberCount(f.kk_number) }} Anggota</span>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-outline w-full" (click)="openDetail(f)">Kelola Anggota</button>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div class="pagination-container mt-8" *ngIf="families().length > pageSize()">
      <div class="pagination-info">
        Menampilkan {{ startRange() }} - {{ endRange() }} dari {{ families().length }} KK
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
  `,
  styles: [`
    .families-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .family-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      .card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        position: relative;
        .icon { font-size: 1.5rem; background: rgba(255,255,255,0.05); padding: 0.5rem; border-radius: 0.5rem; }
        .head-info { flex: 1; min-width: 0; h4 { margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } p { margin: 0; font-size: 0.8rem; color: var(--primary); } }
        .card-actions { display: flex; gap: 0.25rem; }
      }
      .card-body {
        flex: 1;
        .address { font-size: 0.9rem; margin-bottom: 0.5rem; }
        .card-meta { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          .sub { font-size: 0.75rem; color: var(--text-muted); }
          .member-badge { font-size: 0.7rem; background: rgba(99, 102, 241, 0.1); color: #a5b4fc; padding: 0.1rem 0.6rem; border-radius: 1rem; border: 1px solid rgba(165, 180, 252, 0.2); }
        }
      }
    }
    .form-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .form-card {
      width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; padding: 3rem;
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      &.wide { max-width: 950px; }
    }
    .input-group {
      display: flex; flex-direction: column; gap: 0.5rem;
      label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    input, select {
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
      color: white; padding: 0.85rem 1rem; border-radius: 0.75rem; outline: none;
      transition: all 0.2s;
      &:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); box-shadow: 0 0 15px rgba(99,102,241,0.2); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
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
    select option { background-color: #0f172a !important; color: white !important; }
    .btn-outline {
      background: none;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.6rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s;
      &:hover { background: var(--primary); color: white; }
    }
    .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .btn-sm { padding: 0.4rem 0.8rem; font-size: 0.8rem; }
    .btn-icon {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      padding: 0.3rem;
      border-radius: 0.4rem;
      cursor: pointer;
      font-size: 0.8rem;
      &:hover { border-color: var(--primary); }
      &.delete:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    }
    .btn-delete-sm { background: none; border: none; cursor: pointer; opacity: 0.5; &:hover { opacity: 1; } }
    .section-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .member-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: rgba(255,255,255,0.02);
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      gap: 1rem;
      .nik { color: var(--primary); font-weight: 600; width: 140px; }
      .name { flex: 1; }
      .badge { background: var(--primary-glow); padding: 0.1rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; }
    }
    .w-full { width: 100%; }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
  `]
})
export class FamiliesComponent implements OnDestroy {
  private dataService = inject(DataService);
  private pdfService = inject(PdfService);
  private regionService = inject(RegionService);
  families = signal<Family[]>([]);
  showAddFamily = signal(false);
  familyToEdit = signal<Family | null>(null);
  selectedFamily = signal<Family | null>(null);
  showAddResident = signal(false);
  members = signal<Resident[]>([]);
  allResidents = signal<Resident[]>([]);
  private subscriptions: any[] = [];
  private villageConfig: VillageConfig | null = null;

  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(8); // Grid looks better with 8 (2 rows of 4)

  paginatedFamilies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.families().slice(start, end);
  });

  totalPages = computed(() => Math.ceil(this.families().length / this.pageSize()));
  totalPagesArray = computed(() => {
    const pages = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  });

  startRange = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endRange = computed(() => Math.min(this.currentPage() * this.pageSize(), this.families().length));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  familyForm: Family = this.resetFamilyForm();
  newResident: Resident = this.resetResidentForm();

  constructor() {
    this.refreshData();

    // Load Village Config for auto-fill
    this.regionService.getVillageConfig().subscribe(config => {
      if (config) {
        this.villageConfig = config;
        // Update default form values
        this.familyForm = this.resetFamilyForm();
      }
    });

    // Realtime Subscriptions
    this.subscriptions.push(
      this.dataService.subscribeToFamilies(() => this.refreshData())
    );
    this.subscriptions.push(
      this.dataService.subscribeToResidents(() => this.refreshData())
    );
  }

  refreshData() {
    this.dataService.getFamilies().subscribe(data => this.families.set(data));
    this.dataService.getResidents().subscribe(data => {
      this.allResidents.set(data);
      // Update members if detail modal is open
      const selected = this.selectedFamily();
      if (selected) {
        this.members.set(data.filter(r => r.family_id === selected.kk_number));
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  getMemberCount(kk_number: string): number {
    return this.allResidents().filter(r => r.family_id === kk_number).length;
  }

  resetFamilyForm(): Family {
    const vc = this.villageConfig;
    return { 
      kk_number: '', 
      head_of_family_name: '', 
      head_of_family_nik: '', 
      address: '', 
      rt_rw: '', 
      rt: '', 
      rw: '', 
      hamlet: '', 
      district: vc?.district_name || '', 
      regency: vc?.regency_name || '', 
      province: vc?.province_name || '', 
      social_class: 'Sedang', 
      print_date: '', 
      created_at: '' 
    };
  }

  resetResidentForm(): Resident {
    return { nik: '', family_id: '', full_name: '', birth_place: '', birth_date: '', gender: 'Laki-laki', occupation: '', relationship: '', created_at: '' };
  }

  editFamily(family: Family) {
    this.familyToEdit.set(family);
    this.familyForm = { ...family };
  }

  closeFamilyForm() {
    this.showAddFamily.set(false);
    this.familyToEdit.set(null);
    this.familyForm = this.resetFamilyForm();
  }

  async saveFamily() {
    if (!this.familyForm.kk_number) return;
    
    if (this.familyToEdit()) {
      await this.dataService.updateFamily(this.familyForm);
    } else {
      await this.dataService.addFamily(this.familyForm);
    }
    
    this.closeFamilyForm();
  }

  async deleteFamily(kk_number: string) {
    if (confirm('Menghapus KK akan tetap mempertahankan data penduduk namun hubungan keluarga akan terputus. Lanjutkan?')) {
      await this.dataService.deleteFamily(kk_number);
    }
  }

  openDetail(family: Family) {
    this.selectedFamily.set(family);
    this.dataService.getResidents(family.kk_number).subscribe(m => this.members.set(m));
  }

  async saveResident() {
    const fam = this.selectedFamily();
    if (!fam || !this.newResident.nik) return;
    this.newResident.family_id = fam.kk_number;
    await this.dataService.addResident(this.newResident);
    this.showAddResident.set(false);
    this.newResident = this.resetResidentForm();
  }

  async deleteMember(nik: string) {
     if (confirm('Hapus anggota dari keluarga ini?')) {
       await this.dataService.deleteResident(nik);
     }
  }

  async downloadFamilyPDF() {
    const fam = this.selectedFamily();
    if (fam) {
      await this.pdfService.generateFamilyCard(fam, this.members());
    }
  }
}
