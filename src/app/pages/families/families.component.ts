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
    <div class="families-page fade-in">
      <header class="header-actions mb-10 flex-between items-start">
        <div class="titles">
          <h2 class="title-gradient text-4xl">Manajemen Kartu Keluarga</h2>
          <p class="text-muted text-lg mt-2">Administrasi data hubungan keluarga dan domisili terpusat desa.</p>
          <div class="flex gap-4 mt-8">
            <button class="btn-primary px-10 py-4 rounded-2xl shadow-xl" (click)="showAddFamily.set(true)" aria-label="Tambah Kartu Keluarga Baru">
               Tambah KK Baru 🏠
            </button>
          </div>
        </div>

        <div class="header-right flex flex-col items-end gap-4">
          <div class="search-box-premium">
            <span class="icon">🔍</span>
            <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Cari No. KK atau Nama Kepala..." aria-label="Cari data keluarga">
          </div>
          <div class="stats-mini flex gap-6">
            <div class="text-right">
              <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase block">TOTAL KELUARGA</span>
              <span class="text-2xl font-black text-slate-900 tabular-nums">{{ families().length }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Modal Form KK Baru / Edit -->
      <div *ngIf="showAddFamily() || familyToEdit()" class="form-overlay fade-in" (click)="closeFamilyForm()">
        <div class="form-card card-luxury p-12" (click)="$event.stopPropagation()">
          <header class="modal-header mb-12">
             <h3 class="title-gradient text-3xl">{{ familyToEdit() ? 'Update Data' : 'Registrasi' }} Kartu Keluarga</h3>
             <p class="text-muted text-lg mt-2">Masukkan informasi dasar kartu keluarga sesuai dokumen resmi.</p>
          </header>
          <form (submit)="saveFamily()">
            <div class="grid grid-cols-2 gap-8">
              <div class="input-group">
                <label class="text-slate-900 font-black mb-3 block">NOMOR KARTU KELUARGA (KK)</label>
                <input [(ngModel)]="familyForm.kk_number" name="kk" placeholder="16 digit nomor KK" required [disabled]="!!familyToEdit()" class="custom-input font-black text-lg">
              </div>
              <div class="input-group">
                <label class="text-slate-900 font-black mb-3 block">NIK KEPALA KELUARGA</label>
                <input [(ngModel)]="familyForm.head_of_family_nik" name="head_nik" placeholder="16 digit NIK" class="custom-input font-black text-lg">
              </div>
              <div class="input-group col-span-2">
                <label class="text-slate-900 font-black mb-3 block">NAMA KEPALA KELUARGA</label>
                <input [(ngModel)]="familyForm.head_of_family_name" name="head" placeholder="Sesuai KTP" required class="custom-input font-black text-lg">
              </div>
              <div class="input-group col-span-2">
                <label class="text-slate-900 font-black mb-3 block">ALAMAT LENGKAP</label>
                <input [(ngModel)]="familyForm.address" name="addr" placeholder="Jalan / No. Rumah / RT-RW" required class="custom-input font-bold">
              </div>
              <div class="input-group">
                <label class="text-slate-900 font-black mb-3 block">WILAYAH / DUSUN</label>
                <select [(ngModel)]="familyForm.hamlet" name="hamlet" class="custom-select font-bold">
                   <option value="Dusun I">Dusun I</option>
                   <option value="Dusun II">Dusun II</option>
                   <option value="Dusun III">Dusun III</option>
                </select>
              </div>
              <div class="input-group">
                <label class="text-slate-900 font-black mb-3 block">KELAS SOSIAL</label>
                <select [(ngModel)]="familyForm.social_class" name="social_class" class="custom-select font-bold">
                  <option value="Sangat Miskin">Sangat Miskin</option>
                  <option value="Miskin">Miskin</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Kaya">Kaya</option>
                </select>
              </div>
            </div>
            <footer class="form-actions mt-12 pt-8 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" class="btn-outline px-10 rounded-xl font-black text-xs" (click)="closeFamilyForm()">BATAL</button>
              <button type="submit" class="btn-primary px-14 py-5 rounded-2xl shadow-2xl font-black">
                {{ familyToEdit() ? 'SIMPAN PERUBAHAN ✅' : 'SIMPAN DATA KK ✅' }}
              </button>
            </footer>
          </form>
        </div>
      </div>

      <!-- Modal Form Detail & Anggota -->
      <div *ngIf="selectedFamily()" class="form-overlay fade-in" (click)="selectedFamily.set(null)">
        <div class="form-card card-luxury wide p-12" (click)="$event.stopPropagation()">
          <header class="modal-header flex justify-between items-start border-b border-slate-100 pb-10">
            <div class="titles">
              <h3 class="title-gradient text-3xl">Detail Keluarga: {{ selectedFamily()?.head_of_family_name }}</h3>
              <p class="text-slate-900 font-black text-lg tracking-tighter mt-1">NO. KK: {{ selectedFamily()?.kk_number }}</p>
            </div>
            <button class="btn-outline px-6 py-3 rounded-xl border-2 font-black text-xs" (click)="downloadFamilyPDF()" aria-label="Cetak Kartu Keluarga">🖨️ CETAK PROFIL PDF</button>
          </header>

          <section class="resident-section mt-10">
            <div class="section-header flex justify-between items-center mb-8">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">DAFTAR ANGGOTA KELUARGA</h4>
              <button class="btn-primary btn-sm px-6 py-3 rounded-xl shadow-lg font-black text-[10px]" (click)="showAddResident.set(true)">+ TAMBAH ANGGOTA</button>
            </div>

            <div class="members-grid grid grid-cols-1 gap-4">
               <article *ngFor="let r of members()" class="member-item p-6 rounded-2xl border border-slate-100 bg-slate-50/30 flex justify-between items-center group hover:bg-white hover:border-primary/20 transition-all shadow-sm">
                 <div class="flex gap-6 items-center">
                    <span class="gender-indicator" [attr.data-gender]="r.gender"></span>
                    <div>
                      <div class="name text-slate-900 font-black text-base">{{ r.full_name }}</div>
                      <div class="nik text-[11px] font-black text-primary font-mono tracking-tighter">{{ r.nik }}</div>
                    </div>
                 </div>
                 <div class="flex gap-4 items-center">
                    <span class="badge secondary font-black text-[9px] uppercase tracking-widest px-4 py-1.5">{{ r.relationship }}</span>
                    <button class="btn-icon-sm delete border-transparent hover:border-rose-200" (click)="deleteMember(r.nik)" title="Hapus Anggota">🗑️</button>
                 </div>
               </article>
               
               <div *ngIf="members().length === 0" class="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                  <p class="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Belum ada anggota terdaftar</p>
               </div>
            </div>
          </section>

          <!-- Nested Add Resident Form -->
          <section *ngIf="showAddResident()" class="add-resident-box card-luxury bg-blue-50/30 mt-10 p-8 border-dashed border-2 border-primary/20">
            <h5 class="font-black text-slate-900 text-sm mb-6 uppercase tracking-widest">Input Anggota Keluarga Baru</h5>
            <div class="grid grid-cols-3 gap-6">
              <div class="input-group">
                <label class="text-[9px] font-black text-primary mb-2 block tracking-widest">NIK ANGGOTA</label>
                <input [(ngModel)]="newResident.nik" placeholder="16 digit NIK" class="custom-input font-bold bg-white">
              </div>
              <div class="input-group">
                <label class="text-[9px] font-black text-primary mb-2 block tracking-widest">NAMA LENGKAP</label>
                <input [(ngModel)]="newResident.full_name" placeholder="Sesuai Akta" class="custom-input font-bold bg-white">
              </div>
              <div class="input-group">
                <label class="text-[9px] font-black text-primary mb-2 block tracking-widest">JENIS KELAMIN</label>
                <select [(ngModel)]="newResident.gender" class="custom-select font-bold bg-white">
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
            </div>
            <div class="mt-8 flex gap-3 justify-end">
               <button class="btn-text font-black text-[10px] tracking-widest uppercase px-6" (click)="showAddResident.set(false)">BATAL</button>
               <button class="btn-primary btn-sm px-10 py-3 rounded-xl shadow-xl font-black text-[10px]" (click)="saveResident()">SIMPAN ANGGOTA ✅</button>
            </div>
          </section>

          <footer class="form-actions mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <button class="btn-primary px-12 py-4 rounded-2xl font-black shadow-2xl" (click)="selectedFamily.set(null)">SELESAI & TUTUP</button>
          </footer>
        </div>
      </div>

      <!-- List KK -->
      <main class="families-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 fade-in">
        <article *ngFor="let f of paginatedFamilies()" class="card-luxury p-8 flex flex-col group hover:shadow-2xl hover:border-primary/20 transition-all duration-500">
          <header class="flex justify-between items-start mb-6">
            <div class="icon-box-large bg-slate-50 text-slate-800 text-2xl p-5 rounded-2xl group-hover:bg-primary/5 group-hover:text-primary transition-colors">🏠</div>
            <div class="flex gap-1">
              <button class="btn-icon-sm border border-slate-100" (click)="editFamily(f)" title="Edit">✏️</button>
              <button class="btn-icon-sm delete border border-slate-100" (click)="deleteFamily(f.kk_number)" title="Hapus">🗑️</button>
            </div>
          </header>
          
          <div class="mb-8">
            <h4 class="text-slate-900 font-black text-xl leading-tight mb-2">{{ f.head_of_family_name }}</h4>
            <p class="text-[11px] font-black text-primary font-mono tracking-tighter">{{ f.kk_number }}</p>
          </div>

          <div class="mb-8 flex-1">
            <p class="text-slate-500 font-bold text-xs leading-relaxed line-clamp-2 mb-4">{{ f.address }}</p>
            <div class="flex-between">
              <span class="badge secondary font-black text-[9px] uppercase tracking-widest px-3 py-1">{{ f.hamlet }}</span>
              <div class="text-right">
                <div class="text-2xl font-black text-slate-900 tabular-nums">{{ getMemberCount(f.kk_number) }}</div>
                <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">ANGGOTA</div>
              </div>
            </div>
          </div>

          <footer class="pt-6 border-t border-slate-50 mt-auto">
            <button class="btn-outline w-full py-4 rounded-2xl border-2 font-black text-xs hover:bg-slate-900 hover:text-white hover:border-slate-900" (click)="openDetail(f)">KELOLA KELUARGA 👥</button>
          </footer>
        </article>
      </main>

      <!-- Empty State -->
      <div *ngIf="filteredFamilies().length === 0" class="py-32 text-center fade-in">
         <div class="text-7xl mb-8">🏠</div>
         <h3 class="text-slate-900 font-black text-2xl">Keluarga tidak ditemukan</h3>
         <p class="text-muted text-lg mt-2">Coba gunakan kata kunci pencarian yang lain.</p>
      </div>

      <!-- Pagination -->
      <footer class="pagination-area mt-12 bg-white card-luxury p-8 flex-between shadow-xl" *ngIf="families().length > pageSize()">
         <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            MENAMPILKAN <b class="text-slate-900">{{ startRange() }}-{{ endRange() }}</b> DARI <b class="text-slate-900">{{ families().length }}</b> DATA KELUARGA
         </div>
         <nav class="flex gap-2">
            <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">⬅️ PREV</button>
            <div class="flex gap-1">
               <button *ngFor="let p of totalPagesArray()" class="btn-page-num" [class.active]="p === currentPage()" (click)="goToPage(p)">{{ p }}</button>
            </div>
            <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">NEXT ➡️</button>
         </nav>
      </footer>
    </div>
  `,
  styles: [`
    .families-page { padding-bottom: 5rem; }
    
    .search-box-premium {
       display: flex; align-items: center; gap: 1rem;
       background: white; border: 1px solid var(--glass-border);
       padding: 1rem 1.75rem; border-radius: 1.5rem; width: 450px;
       transition: 0.4s var(--apple-ease); box-shadow: 0 15px 35px -12px rgba(0,0,0,0.05);
       &:focus-within { border-color: var(--primary); box-shadow: 0 20px 40px -15px var(--primary-glow); }
       input { background: none; border: none; color: #000000; width: 100%; outline: none; font-weight: 800; font-size: 1.1rem; }
       .icon { font-size: 1.25rem; }
    }

    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.9); backdrop-filter: blur(25px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 900px; max-height: 90vh; overflow-y: auto; &.wide { max-width: 1000px; } }
    
    .custom-input, .custom-select {
       width: 100%; background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem 1.25rem; border-radius: 1.25rem;
       outline: none; font-weight: 600; font-size: 1rem; color: #000; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }

    .gender-indicator {
       width: 12px; height: 12px; border-radius: 50%;
       &[data-gender='Laki-laki'] { background: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
       &[data-gender='Perempuan'] { background: #f43f5e; box-shadow: 0 0 10px rgba(244, 63, 94, 0.5); }
    }

    .btn-page-num {
       width: 44px; height: 44px; border-radius: 12px; font-weight: 900; color: #64748b; transition: 0.3s;
       &.active { background: var(--primary); color: white; box-shadow: 0 10px 20px var(--primary-glow); }
    }

    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
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
  searchTerm = signal('');
  
  private subscriptions: any[] = [];
  private villageConfig: VillageConfig | null = null;

  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(8);

  filteredFamilies = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.families().filter(f => 
      (f.head_of_family_name || '').toLowerCase().includes(term) ||
      (f.kk_number || '').includes(term)
    ).sort((a,b) => (a.head_of_family_name || '').localeCompare(b.head_of_family_name || ''));
  });

  paginatedFamilies = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredFamilies().slice(start, end);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredFamilies().length / this.pageSize())));
  totalPagesArray = computed(() => {
    const pages = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({length: end - start + 1}, (_, i) => Math.max(1, start + i));
  });

  startRange = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endRange = computed(() => Math.min(this.currentPage() * this.pageSize(), this.filteredFamilies().length));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  familyForm: Family = this.resetFamilyForm();
  newResident: Resident = this.resetResidentForm();

  constructor() {
    this.refreshData();

    this.regionService.getVillageConfig().subscribe(config => {
      if (config) {
        this.villageConfig = config;
        this.familyForm = this.resetFamilyForm();
      }
    });

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
      hamlet: 'Dusun I', 
      district: vc?.district_name || '', 
      regency: vc?.regency_name || '', 
      province: vc?.province_name || '', 
      social_class: 'Sedang', 
      print_date: '', 
      created_at: '' 
    };
  }

  resetResidentForm(): Resident {
    return { nik: '', family_id: '', full_name: '', birth_place: '', birth_date: '', gender: 'Laki-laki', occupation: '', relationship: 'LAINNYA', created_at: '' };
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
    if (confirm('Menghapus KK akan tetap mempertahankan data penduduk namun hubungan keluarga akan terputus secara administratif. Lanjutkan?')) {
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
     if (confirm('Hapus anggota ini dari daftar keluarga?')) {
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
