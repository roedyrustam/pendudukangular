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
    <header class="header-actions mb-8 fade-in">
      <div class="titles">
        <h2 class="title-gradient">Manajemen Kartu Keluarga</h2>
        <p class="text-muted">Administrasi data hubungan keluarga dan domisili terpusat.</p>
      </div>
      <div class="flex gap-3">
        <button class="btn-primary" (click)="showAddFamily.set(true)" aria-label="Tambah Kartu Keluarga Baru">
           Tambah KK Baru 🏠
        </button>
      </div>
    </header>

    <!-- Modal Form KK Baru / Edit -->
    <div *ngIf="showAddFamily() || familyToEdit()" class="form-overlay fade-in" (click)="closeFamilyForm()">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header mb-8">
           <h3 class="title-gradient">{{ familyToEdit() ? 'Update Data' : 'Registrasi' }} Kartu Keluarga</h3>
           <p class="text-muted">Pastikan nomor KK dan data kepala keluarga sesuai dengan dokumen fisik.</p>
        </header>
        <form (submit)="saveFamily()">
          <div class="form-grid">
            <div class="input-group">
              <label>Nomor KK (16 Digit)</label>
              <input [(ngModel)]="familyForm.kk_number" name="kk" placeholder="16 digit nomor KK" required [disabled]="!!familyToEdit()" class="custom-input">
            </div>
            <div class="input-group">
              <label>NIK Kepala Keluarga</label>
              <input [(ngModel)]="familyForm.head_of_family_nik" name="head_nik" placeholder="16 digit NIK" class="custom-input">
            </div>
            <div class="input-group">
              <label>Kepala Keluarga</label>
              <input [(ngModel)]="familyForm.head_of_family_name" name="head" placeholder="Nama lengkap sesuai KTP" required class="custom-input">
            </div>
            <div class="input-group" style="grid-column: 1 / -1;">
              <label>Alamat Lengkap</label>
              <input [(ngModel)]="familyForm.address" name="addr" placeholder="Jalan / No. Rumah / Perumahan" required class="custom-input">
            </div>
            <div class="input-group">
              <label>RT / RW</label>
              <div class="flex gap-2">
                 <input [(ngModel)]="familyForm.rt" name="rt" placeholder="RT" class="custom-input" style="width: 80px;">
                 <input [(ngModel)]="familyForm.rw" name="rw" placeholder="RW" class="custom-input" style="width: 80px;">
              </div>
            </div>
            <div class="input-group">
              <label>Wilayah / Dusun</label>
              <select [(ngModel)]="familyForm.hamlet" name="hamlet" class="custom-select">
                 <option value="Dusun I">Dusun I</option>
                 <option value="Dusun II">Dusun II</option>
                 <option value="Dusun III">Dusun III</option>
              </select>
            </div>
            <div class="input-group">
              <label>Kelas Sosial</label>
              <select [(ngModel)]="familyForm.social_class" name="social_class" class="custom-select">
                <option value="Sangat Miskin">Sangat Miskin</option>
                <option value="Miskin">Miskin</option>
                <option value="Sedang">Sedang</option>
                <option value="Kaya">Kaya</option>
              </select>
            </div>
            <div class="input-group">
              <label>Tanggal Cetak KK</label>
              <input type="date" [(ngModel)]="familyForm.print_date" name="print_date" class="custom-input">
            </div>
          </div>
          <footer class="form-actions mt-8 flex justify-end gap-3">
            <button type="button" class="btn-outline" (click)="closeFamilyForm()">Batal</button>
            <button type="submit" class="btn-primary">{{ familyToEdit() ? 'Simpan Perubahan' : 'Simpan Data' }}</button>
          </footer>
        </form>
      </div>
    </div>

    <!-- Modal Form Detail & Anggota -->
    <div *ngIf="selectedFamily()" class="form-overlay fade-in" (click)="selectedFamily.set(null)">
      <div class="form-card card-luxury glass-panel wide" (click)="$event.stopPropagation()">
        <header class="modal-header flex justify-between items-start">
          <div class="titles">
            <h3 class="title-gradient">Detail Keluarga: {{ selectedFamily()?.head_of_family_name }}</h3>
            <p class="text-muted font-bold">NOMOR KK: {{ selectedFamily()?.kk_number }}</p>
          </div>
          <button class="btn-outline" (click)="downloadFamilyPDF()" aria-label="Cetak Kartu Keluarga">🖨️ Cetak Profil PDF</button>
        </header>

        <section class="resident-section mt-8">
          <div class="section-header flex justify-between items-center mb-6">
            <h4 class="text-slate-800 font-extrabold uppercase tracking-widest text-xs">Anggota Keluarga Terdaftar</h4>
            <button class="btn-primary btn-sm" (click)="showAddResident.set(true)">+ Tambah Anggota</button>
          </div>

          <div class="members-list">
             <article *ngFor="let r of members()" class="member-item card-luxury p-4 mb-3 flex justify-between items-center">
               <div class="flex gap-4 items-center">
                  <span class="nik-cell text-sm">{{ r.nik }}</span>
                  <span class="name text-slate-800 font-bold">{{ r.full_name }}</span>
               </div>
               <div class="flex gap-3 items-center">
                  <span class="badge secondary">{{ r.relationship }}</span>
                  <button class="btn-icon delete" (click)="deleteMember(r.nik)" title="Hapus Anggota">🗑️</button>
               </div>
             </article>
             <p *ngIf="members().length === 0" class="empty-state">Belum ada anggota terdaftar.</p>
          </div>
        </section>

        <!-- Nested Add Resident Form -->
        <section *ngIf="showAddResident()" class="add-resident-box card-luxury bg-slate-50 mt-6 p-6 border-dashed border-2 border-slate-200">
          <h5 class="font-bold mb-4">Input Anggota Keluarga Baru</h5>
          <div class="form-grid-3">
            <input [(ngModel)]="newResident.nik" placeholder="NIK (16 digit)" class="custom-input">
            <input [(ngModel)]="newResident.full_name" placeholder="Nama Lengkap" class="custom-input">
            <select [(ngModel)]="newResident.gender" class="custom-select">
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>
          <div class="mt-4 flex gap-2 justify-end">
             <button class="btn-outline btn-sm" (click)="showAddResident.set(false)">Batal</button>
             <button class="btn-primary btn-sm" (click)="saveResident()">Simpan Anggota</button>
          </div>
        </section>

        <footer class="form-actions mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button class="btn-primary" (click)="selectedFamily.set(null)">Selesai & Tutup</button>
        </footer>
      </div>
    </div>

    <!-- List KK -->
    <main class="families-grid fade-in">
      <article *ngFor="let f of paginatedFamilies()" class="card-luxury family-card">
        <header class="card-header">
          <div class="icon-box azure">🏠</div>
          <div class="head-info">
            <h4 class="text-slate-800">{{ f.head_of_family_name }}</h4>
            <p class="nik-cell text-xs">{{ f.kk_number }}</p>
          </div>
          <div class="card-actions flex gap-1">
            <button class="btn-icon" (click)="editFamily(f)" title="Edit KK">✏️</button>
            <button class="btn-icon delete" (click)="deleteFamily(f.kk_number)" title="Hapus KK">🗑️</button>
          </div>
        </header>
        <div class="card-body py-4">
          <p class="address text-slate-600 text-sm mb-3">{{ f.address }}</p>
          <div class="card-meta flex justify-between items-center">
            <span class="badge secondary">{{ f.hamlet }}</span>
            <span class="member-count font-bold text-primary">{{ getMemberCount(f.kk_number) }} <small>Anggota</small></span>
          </div>
        </div>
        <footer class="card-footer mt-auto pt-4 border-t border-slate-50">
          <button class="btn-outline w-full" (click)="openDetail(f)">Kelola Anggota Keluarga</button>
        </footer>
      </article>
    </main>

    <!-- Pagination Controls -->
    <footer class="pagination-container mt-12 glass-panel p-6 flex justify-between items-center fade-in" *ngIf="families().length > pageSize()">
      <div class="pagination-info text-muted">
        Menampilkan <b>{{ startRange() }} - {{ endRange() }}</b> dari <b>{{ families().length }}</b> Kartu Keluarga
      </div>
      <nav class="pagination-controls flex gap-2" aria-label="Navigasi Halaman KK">
        <button class="btn-page" (click)="goToPage(currentPage() - 1)" [disabled]="currentPage() === 1">Sebelumnya</button>
        <div class="page-numbers flex gap-1">
          <button *ngFor="let p of totalPagesArray()" 
                  (click)="goToPage(p)" 
                  class="btn-page-num"
                  [class.active]="currentPage() === p">
            {{ p }}
          </button>
        </div>
        <button class="btn-page" (click)="goToPage(currentPage() + 1)" [disabled]="currentPage() === totalPages()">Selanjutnya</button>
      </nav>
    </footer>
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
      height: 100%;
      transition: all 0.4s var(--apple-ease);
      &:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); }
      .card-header {
        display: flex; align-items: center; gap: 1rem;
        .head-info { flex: 1; min-width: 0; h4 { margin: 0; font-weight: 800; } }
      }
    }
    .icon-box {
      width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      &.azure { background: rgba(37, 99, 235, 0.05); color: var(--primary); }
    }
    .form-overlay {
      position: fixed; inset: 0; background: rgba(241, 245, 249, 0.8); backdrop-filter: blur(15px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .form-card { width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; padding: 4rem; &.wide { max-width: 1000px; } }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .form-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    
    .custom-input, .custom-select {
       width: 100%; background: #f8fafc; border: 1px solid var(--glass-border);
       color: #000; padding: 1rem; border-radius: 1rem; outline: none; font-weight: 600;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
    .btn-icon {
      background: white; border: 1px solid var(--glass-border); width: 34px; height: 34px;
      border-radius: 10px; cursor: pointer; transition: 0.3s;
      &:hover { border-color: var(--primary); color: var(--primary); }
      &.delete:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    }
    .pagination-container { background: rgba(255,255,255,0.5); border-top: 1px solid var(--glass-border); border-radius: 2rem; }
    .btn-page-num {
       width: 36px; height: 36px; border-radius: 10px; border: none; background: transparent;
       color: var(--text-muted); font-weight: 700; cursor: pointer;
       &.active { background: var(--primary); color: white; box-shadow: 0 4px 12px var(--primary-glow); }
    }
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
