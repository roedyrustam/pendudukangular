import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegionService } from '../../services/region.service';
import { KemendesaService } from '../../services/kemendesa.service';
import { RegionItem, VillageConfig } from '../../models/data.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container fade-in">
      <header class="header-actions mb-10">
        <h2 class="title-gradient text-4xl">Pengaturan Sistem</h2>
        <p class="text-muted text-lg mt-2">Kelola identitas desa, profil administratif, dan konfigurasi keamanan sistem DigiWarga.</p>
      </header>

      <!-- Premium Tab Navigation -->
      <nav class="tab-nav glass-panel mb-12 p-1.5 flex gap-1 rounded-2xl border border-slate-200 bg-slate-50/50">
        <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')" class="tab-btn">
          <span class="icon">👤</span> Profil & Keamanan
        </button>
        <button [class.active]="activeTab() === 'village'" (click)="activeTab.set('village')" class="tab-btn">
          <span class="icon">🏘️</span> Identitas & Wilayah Desa
        </button>
      </nav>

      <main class="tab-content">
        <!-- PROFILE & SECURITY TAB -->
        <section *ngIf="activeTab() === 'profile'" class="grid grid-cols-2 gap-10">
          <!-- Profile Card -->
          <article class="card-luxury p-8">
            <header class="flex items-center gap-4 mb-10">
               <div class="icon-box bg-blue-50 text-primary p-3 rounded-2xl border border-blue-100">👤</div>
               <div>
                  <h3 class="text-slate-900 font-black text-xl">Informasi Profil</h3>
                  <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Identitas Admin Terdaftar</p>
               </div>
            </header>

            <form (submit)="updateProfile()" class="space-y-6">
              <div class="input-group">
                <label class="text-slate-900 font-black">NAMA LENGKAP / DISPLAY NAME</label>
                <input [(ngModel)]="displayName" name="displayName" placeholder="Contoh: Admin DigiWarga" required class="custom-input">
              </div>
              <div class="input-group" *ngIf="user$ | async as user">
                <label class="text-slate-900 font-black">EMAIL UTAMA (LOGIN)</label>
                <input [value]="user.email" disabled class="custom-input opacity-40 cursor-not-allowed">
                <small class="text-xs text-slate-400 font-bold mt-2">Email dikelola secara terpusat oleh sistem autentikasi.</small>
              </div>
              <button type="submit" class="btn-primary w-full py-4 rounded-2xl" [disabled]="loadingProfile()">
                {{ loadingProfile() ? 'Menyimpan Perubahan...' : 'Simpan Perubahan Profil ✅' }}
              </button>
            </form>
            
            <div *ngIf="profileMessage()" class="status-msg mt-6" [class.success]="isProfileSuccess()">
              {{ profileMessage() }}
            </div>
          </article>

          <!-- Security Card -->
          <article class="card-luxury p-8">
            <header class="flex items-center gap-4 mb-10">
               <div class="icon-box bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100">🔒</div>
               <div>
                  <h3 class="text-slate-900 font-black text-xl">Keamanan Akun</h3>
                  <p class="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Proteksi Akses & Password</p>
               </div>
            </header>

            <form (submit)="changePassword()" class="space-y-6">
              <div class="input-group">
                <label class="text-slate-900 font-black">PASSWORD BARU</label>
                <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="Minimum 6 karakter" required class="custom-input">
              </div>
              <div class="input-group">
                <label class="text-slate-900 font-black">KONFIRMASI PASSWORD</label>
                <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Ketik ulang password baru" required class="custom-input">
              </div>
              <button type="submit" class="btn-outline w-full py-4 rounded-2xl border-2" [disabled]="loadingSecurity()">
                {{ loadingSecurity() ? 'Sedang Memproses...' : 'Perbarui Kata Sandi 🔒' }}
              </button>
            </form>

            <div *ngIf="securityMessage()" class="status-msg mt-6" [class.success]="isSecuritySuccess()">
              {{ securityMessage() }}
            </div>
          </article>
        </section>

        <!-- VILLAGE CONFIG TAB -->
        <section *ngIf="activeTab() === 'village'" class="space-y-10">
          
          <!-- Current Active Identity -->
          <article *ngIf="currentConfig()" class="card-luxury p-0 overflow-hidden border-primary/20 bg-slate-50/30">
            <header class="bg-primary p-10 flex-between items-center text-white">
               <div>
                  <h3 class="text-white font-black text-2xl">Identitas Desa Aktif</h3>
                  <p class="text-white/70 font-bold text-sm">Wilayah hukum administratif terdaftar saat ini.</p>
               </div>
               <div class="village-seal-small bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <img [src]="currentConfig()?.village_logo_url || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=200&auto=format&fit=crop'" class="h-12 w-12 object-contain" alt="Logo Desa">
               </div>
            </header>

            <div class="p-10 grid grid-cols-4 gap-6">
              <div class="info-block border-l-4 border-blue-500 pl-6">
                <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase">PROVINSI</span>
                <p class="text-slate-900 font-black text-lg">{{ currentConfig()?.province_name }}</p>
                <code class="text-xs text-primary font-bold">{{ currentConfig()?.province_code }}</code>
              </div>
              <div class="info-block border-l-4 border-blue-500 pl-6">
                <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase">KABUPATEN/KOTA</span>
                <p class="text-slate-900 font-black text-lg">{{ currentConfig()?.regency_name }}</p>
                <code class="text-xs text-primary font-bold">{{ currentConfig()?.regency_code }}</code>
              </div>
              <div class="info-block border-l-4 border-blue-500 pl-6">
                <span class="text-[10px] font-black text-slate-400 tracking-widest uppercase">KECAMATAN</span>
                <p class="text-slate-900 font-black text-lg">{{ currentConfig()?.district_name }}</p>
                <code class="text-xs text-primary font-bold">{{ currentConfig()?.district_code }}</code>
              </div>
              <div class="info-block border-l-4 border-emerald-500 pl-6 bg-emerald-50/30 p-3 rounded-r-2xl">
                <span class="text-[10px] font-black text-emerald-600 tracking-widest uppercase">DESA / KELURAHAN</span>
                <p class="text-slate-900 font-black text-lg">{{ currentConfig()?.village_name }}</p>
                <code class="text-xs text-emerald-600 font-bold">{{ currentConfig()?.village_code }}</code>
              </div>
            </div>

            <footer class="p-6 bg-white border-t border-slate-100 flex gap-8 justify-center">
              <span class="text-xs text-slate-600 font-bold">🧑‍💼 Kepala Desa: <b class="text-slate-900">{{ currentConfig()?.village_head || 'Belum Diatur' }}</b></span>
              <span class="text-xs text-slate-600 font-bold">📞 Telp: <b class="text-slate-900">{{ currentConfig()?.village_phone || 'Belum Diatur' }}</b></span>
              <span class="text-xs text-slate-600 font-bold">✉️ Email: <b class="text-slate-900">{{ currentConfig()?.village_email || 'Belum Diatur' }}</b></span>
            </footer>
          </article>

          <!-- Configuration Form -->
          <article class="card-luxury p-10">
            <header class="flex-between items-center mb-10">
               <div>
                  <h3 class="text-slate-900 font-black text-2xl">{{ currentConfig() ? 'Perbarui' : 'Daftarkan' }} Konfigurasi Desa</h3>
                  <p class="text-muted text-sm mt-1">Pilih wilayah berdasarkan data nasional Kemendagri & wilayah.id.</p>
               </div>
               <div *ngIf="loadingRegion()" class="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl text-primary font-bold text-xs animate-pulse">
                  <div class="spinner-small border-primary"></div> Mensinkronkan Data Wilayah...
               </div>
            </header>

            <!-- SMART SEARCH -->
            <section class="smart-search-area mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <label class="text-slate-900 font-black text-sm mb-4 block">⚡ CARI & SINKRONKAN OTOMATIS</label>
              <div class="relative search-container">
                <input type="text" [(ngModel)]="searchQuery" (input)="onSearchInput()" placeholder="Ketik nama desa Anda... (Contoh: Pangkajene)" class="custom-input text-lg py-5 shadow-xl">
                <div class="search-results-overlay" *ngIf="searchResults().length > 0">
                  <div class="result-card p-4 hover:bg-primary/5 cursor-pointer border-b border-slate-50 flex-between" *ngFor="let res of searchResults()" (click)="selectSearchResult(res)">
                    <div>
                       <div class="res-name font-black text-slate-900">{{ res.village_name || res.name }}</div>
                       <div class="res-path text-[10px] font-bold text-slate-500 uppercase">{{ res.district_name }} • {{ res.regency_name }} • {{ res.province_name }}</div>
                    </div>
                    <span class="text-primary font-black text-xs">PILIH & SINKRON ➡️</span>
                  </div>
                </div>
              </div>
              <p class="text-xs text-slate-400 font-bold mt-4 italic">* Rekomendasi: Gunakan fitur pencarian otomatis untuk meminimalkan kesalahan input data wilayah.</p>
            </section>

            <form (submit)="saveVillageConfig()" class="space-y-10">
              <div class="region-selectors grid grid-cols-2 gap-8">
                <div class="input-group">
                  <label class="text-slate-900 font-black">PROVINSI <span class="badge" *ngIf="provinces().length">{{ provinces().length }}</span></label>
                  <select [(ngModel)]="selectedProvince" name="province" (change)="onProvinceChange()" required class="custom-select">
                    <option value="">-- Pilih Provinsi --</option>
                    <option *ngFor="let p of provinces()" [value]="p.code">{{ p.name }}</option>
                  </select>
                </div>

                <div class="input-group">
                  <label class="text-slate-900 font-black">KABUPATEN / KOTA <span class="badge" *ngIf="regencies().length">{{ regencies().length }}</span></label>
                  <select [(ngModel)]="selectedRegency" name="regency" (change)="onRegencyChange()" required [disabled]="!selectedProvince" class="custom-select">
                    <option value="">-- Pilih Kabupaten / Kota --</option>
                    <option *ngFor="let r of regencies()" [value]="r.code">{{ r.name }}</option>
                  </select>
                </div>

                <div class="input-group">
                  <label class="text-slate-900 font-black">KECAMATAN <span class="badge" *ngIf="districts().length">{{ districts().length }}</span></label>
                  <select [(ngModel)]="selectedDistrict" name="district" (change)="onDistrictChange()" required [disabled]="!selectedRegency" class="custom-select">
                    <option value="">-- Pilih Kecamatan --</option>
                    <option *ngFor="let d of districts()" [value]="d.code">{{ d.name }}</option>
                  </select>
                </div>

                <div class="input-group">
                  <label class="text-slate-900 font-black">DESA / KELURAHAN <span class="badge" *ngIf="villages().length">{{ villages().length }}</span></label>
                  <select [(ngModel)]="selectedVillage" name="village" required [disabled]="!selectedDistrict" class="custom-select">
                    <option value="">-- Pilih Desa / Kelurahan --</option>
                    <option *ngFor="let v of villages()" [value]="v.code">{{ v.name }}</option>
                  </select>
                </div>
              </div>

              <!-- Extra Village Meta -->
              <div class="extra-meta grid grid-cols-2 gap-8 border-t border-slate-100 pt-10" *ngIf="selectedVillage">
                <div class="input-group">
                  <label class="text-slate-900 font-black">NAMA KEPALA DESA</label>
                  <input [(ngModel)]="villageForm.village_head" name="village_head" placeholder="Nama Lengkap & Gelar" class="custom-input">
                </div>
                <div class="input-group">
                  <label class="text-slate-900 font-black">NIP KEPALA DESA</label>
                  <input [(ngModel)]="villageForm.village_head_nip" name="village_head_nip" placeholder="NIP (Khusus PNS)" class="custom-input">
                </div>
                <div class="input-group">
                  <label class="text-slate-900 font-black">SEKRETARIS DESA</label>
                  <input [(ngModel)]="villageForm.village_secretary" name="village_secretary" placeholder="Nama Lengkap Sekretaris" class="custom-input">
                </div>
                <div class="input-group">
                  <label class="text-slate-900 font-black">KODE POS WILAYAH</label>
                  <input [(ngModel)]="villageForm.zip_code" name="zip_code" placeholder="Contoh: 40171" class="custom-input">
                </div>
                <div class="input-group col-span-2">
                  <label class="text-slate-900 font-black">ALAMAT KANTOR DESA</label>
                  <input [(ngModel)]="villageForm.village_address" name="village_address" placeholder="Jl. Raya Desa No. ..." class="custom-input">
                </div>
                
                <div class="logo-area col-span-2 bg-slate-50 p-8 rounded-3xl border border-slate-100 flex items-center gap-10">
                   <div class="preview-box h-32 w-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden p-2">
                      <img [src]="logoPreview() || villageForm.village_logo_url || 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=200'" alt="Logo Preview" class="max-h-full max-w-full object-contain">
                   </div>
                   <div class="flex-1">
                      <h4 class="text-slate-900 font-black mb-2 uppercase text-xs tracking-wider">LOGO RESMI PEMERINTAH DESA</h4>
                      <p class="text-slate-500 text-sm mb-6">Gunakan file PNG transparan untuk hasil terbaik pada dokumen PDF surat-menyurat.</p>
                      <input type="file" (change)="onLogoSelected($event)" accept="image/*" #logoInput hidden>
                      <button type="button" class="btn-outline px-8 rounded-xl font-black text-xs" (click)="logoInput.click()" [disabled]="uploadingLogo()">
                        {{ uploadingLogo() ? 'MENGUNGGAH...' : 'PILIH FILE LOGO 📁' }}
                      </button>
                   </div>
                </div>
              </div>

              <footer class="pt-10 border-t border-slate-100 flex justify-end gap-4">
                <button type="submit" class="btn-primary px-12 py-5 rounded-2xl shadow-2xl text-lg" [disabled]="!selectedVillage || savingConfig()">
                  {{ savingConfig() ? 'Sedang Menyimpan...' : '💾 Simpan Konfigurasi Desa' }}
                </button>
              </footer>
            </form>

            <div *ngIf="configMessage()" class="status-msg mt-8" [class.success]="isConfigSuccess()">
              {{ configMessage() }}
            </div>
          </article>
        </section>
      </main>

      <footer class="footer-info mt-12 p-6 text-center card-luxury bg-slate-50/50" *ngIf="user$ | async as user">
        <p class="text-slate-500 font-bold text-xs uppercase tracking-widest">Sesi Login Aktif: {{ user.last_sign_in_at | date:'medium' }}</p>
      </footer>
    </div>
  `,
  styles: [`
    .settings-container { padding-bottom: 6rem; }
    
    .tab-btn {
       flex: 1; padding: 1.25rem; background: transparent; border: none;
       color: #64748b; font-weight: 800; font-size: 0.95rem; border-radius: 1rem;
       transition: 0.4s var(--apple-ease); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
       .icon { font-size: 1.2rem; }
       &:hover { background: white; color: var(--primary); }
       &.active { background: white; color: var(--primary); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    }

    .custom-input, .custom-select {
       background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem 1.25rem; border-radius: 1rem;
       outline: none; font-weight: 600; font-size: 1rem; width: 100%; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }

    .badge { font-size: 0.65rem; background: rgba(37, 99, 235, 0.1); color: var(--primary); padding: 0.15rem 0.6rem; border-radius: 1rem; margin-left: 0.5rem; }

    .search-results-overlay {
       position: absolute; top: 100%; left: 0; right: 0; background: white; border-radius: 1.5rem;
       box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); z-index: 100; margin-top: 0.5rem; overflow: hidden; border: 1px solid var(--glass-border);
    }

    .status-msg {
       padding: 1.25rem; border-radius: 1rem; font-weight: 800; font-size: 0.85rem; text-align: center;
       background: rgba(239, 68, 68, 0.05); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.1);
       &.success { background: rgba(16, 185, 129, 0.05); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.1); }
    }

    .spinner-small { width: 16px; height: 16px; border: 2.5px solid rgba(0,0,0,0.1); border-top-color: currentColor; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private regionService = inject(RegionService);
  private kemendesaService = inject(KemendesaService);
  user$ = this.authService.user$;

  activeTab = signal<'profile' | 'village'>('profile');

  // Profile
  displayName = '';
  newPassword = '';
  confirmPassword = '';

  ngOnInit() {
    this.user$.subscribe(user => {
      if (user) {
        this.displayName = user.user_metadata?.['display_name'] || user.email?.split('@')[0] || '';
      }
    });

    // Load provinces on init
    this.loadProvinces();

    // Load existing config
    this.regionService.getVillageConfig().subscribe(config => {
      if (config) {
        this.currentConfig.set(config);
        this.villageForm = { ...config };
        // Pre-populate selections
        this.selectedProvince = config.province_code;
        this.selectedRegency = config.regency_code;
        this.selectedDistrict = config.district_code;
        this.selectedVillage = config.village_code;
        // Load cascading data
        this.regionService.getRegencies(config.province_code).then(d => this.regencies.set(d));
        this.regionService.getDistricts(config.regency_code).then(d => this.districts.set(d));
        this.regionService.getVillages(config.district_code).then(d => this.villages.set(d));
      }
    });
  }

  // --- Profile & Security ---
  loadingProfile = signal(false);
  profileMessage = signal('');
  isProfileSuccess = signal(false);

  loadingSecurity = signal(false);
  securityMessage = signal('');
  isSecuritySuccess = signal(false);

  async updateProfile() {
    if (!this.displayName) return;
    this.loadingProfile.set(true);
    this.profileMessage.set('');
    
    try {
      await this.authService.updateUserProfile(this.displayName);
      this.isProfileSuccess.set(true);
      this.profileMessage.set('Profil berhasil diperbarui!');
    } catch (err: any) {
      this.isProfileSuccess.set(false);
      this.profileMessage.set('Gagal memperbarui profil: ' + err.message);
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Konfirmasi password tidak cocok.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Password minimal 6 karakter.');
      return;
    }

    this.loadingSecurity.set(true);
    this.securityMessage.set('');

    try {
      await this.authService.updateUserPassword(this.newPassword);
      this.isSecuritySuccess.set(true);
      this.securityMessage.set('Password berhasil diganti!');
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Gagal ganti password: ' + err.message);
    } finally {
      this.loadingSecurity.set(false);
    }
  }

  // --- Village Configuration ---
  provinces = signal<RegionItem[]>([]);
  regencies = signal<RegionItem[]>([]);
  districts = signal<RegionItem[]>([]);
  villages = signal<RegionItem[]>([]);
  
  currentConfig = signal<VillageConfig | null>(null);
  loadingRegion = signal(false);
  savingConfig = signal(false);
  configMessage = signal('');
  isConfigSuccess = signal(false);

  selectedProvince = '';
  selectedRegency = '';
  selectedDistrict = '';
  selectedVillage = '';
  searchQuery = '';
  searchResults = signal<any[]>([]);

  villageForm: Partial<VillageConfig> = {};
  uploadingLogo = signal(false);
  logoPreview = signal<string | null>(null);

  onSearchInput() {
    if (this.searchQuery.length < 3) {
      this.searchResults.set([]);
      return;
    }
    this.kemendesaService.searchVillage(this.searchQuery).subscribe((results: any[]) => {
      this.searchResults.set(results);
    });
  }

  async selectSearchResult(res: any) {
    this.loadingRegion.set(true);
    this.searchResults.set([]);
    this.searchQuery = res.village_name || res.name;

    try {
      // res usually contains codes: province_code, regency_code, etc.
      this.selectedProvince = res.province_code;
      this.selectedRegency = res.regency_code;
      this.selectedDistrict = res.district_code;
      this.selectedVillage = res.code || res.village_code;

      // Force load cascading lists so dropdowns are in sync
      await Promise.all([
        this.regionService.getRegencies(this.selectedProvince).then(d => this.regencies.set(d)),
        this.regionService.getDistricts(this.selectedRegency).then(d => this.districts.set(d)),
        this.regionService.getVillages(this.selectedDistrict).then(d => this.villages.set(d))
      ]);

      // Sync data from Kemendesa if possible
      this.kemendesaService.getVillageProfile(this.selectedVillage).subscribe((profile: any) => {
        if (profile) {
          this.villageForm.village_head = profile.kepala_desa || this.villageForm.village_head;
          this.villageForm.village_address = profile.alamat || this.villageForm.village_address;
          this.villageForm.village_phone = profile.telepon || this.villageForm.village_phone;
          this.villageForm.village_email = profile.email || this.villageForm.village_email;
        }
      });

      // Sync IDM & Financial Data
      this.kemendesaService.getVillageIdm(this.selectedVillage).subscribe((idm: any) => {
        if (idm) {
          this.villageForm.idm_status = idm.status;
          this.villageForm.idm_score = idm.skor;
          this.villageForm.dana_desa = idm.alokasi_dana_desa;
        }
      });

      this.configMessage.set(`✅ Desa ${this.searchQuery} berhasil disinkronkan!`);
      this.isConfigSuccess.set(true);
    } catch (e) {
      console.error(e);
      this.configMessage.set('⚠️ Sinkronisasi parsial berhasil, silakan periksa kembali data di bawah.');
    } finally {
      this.loadingRegion.set(false);
    }
  }

  async smartSearch() {
    // Legacy method, replaced by selectSearchResult
  }

  async onLogoSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Show preview locally
    const reader = new FileReader();
    reader.onload = () => this.logoPreview.set(reader.result as string);
    reader.readAsDataURL(file);

    this.uploadingLogo.set(true);
    try {
      const publicUrl = await this.regionService.uploadVillageLogo(file);
      this.villageForm.village_logo_url = publicUrl;
    } catch (err: any) {
      alert('Gagal mengunggah logo: ' + err.message);
    } finally {
      this.uploadingLogo.set(false);
    }
  }

  async loadProvinces() {
    this.loadingRegion.set(true);
    try {
      const data = await this.regionService.getProvinces();
      this.provinces.set(data);
    } catch (e) {
      console.error('Failed to load provinces', e);
    } finally {
      this.loadingRegion.set(false);
    }
  }

  async onProvinceChange() {
    this.regencies.set([]);
    this.districts.set([]);
    this.villages.set([]);
    this.selectedRegency = '';
    this.selectedDistrict = '';
    this.selectedVillage = '';

    if (!this.selectedProvince) return;
    this.loadingRegion.set(true);
    try {
      const data = await this.regionService.getRegencies(this.selectedProvince);
      this.regencies.set(data);
    } catch (e) { console.error(e); }
    finally { this.loadingRegion.set(false); }
  }

  async onRegencyChange() {
    this.districts.set([]);
    this.villages.set([]);
    this.selectedDistrict = '';
    this.selectedVillage = '';

    if (!this.selectedRegency) return;
    this.loadingRegion.set(true);
    try {
      const data = await this.regionService.getDistricts(this.selectedRegency);
      this.districts.set(data);
    } catch (e) { console.error(e); }
    finally { this.loadingRegion.set(false); }
  }

  async onDistrictChange() {
    this.villages.set([]);
    this.selectedVillage = '';

    if (!this.selectedDistrict) return;
    this.loadingRegion.set(true);
    try {
      const data = await this.regionService.getVillages(this.selectedDistrict);
      this.villages.set(data);
    } catch (e) { console.error(e); }
    finally { this.loadingRegion.set(false); }
  }

  async saveVillageConfig() {
    if (!this.selectedVillage) return;

    const provinceName = this.provinces().find(p => p.code === this.selectedProvince)?.name || '';
    const regencyName = this.regencies().find(r => r.code === this.selectedRegency)?.name || '';
    const districtName = this.districts().find(d => d.code === this.selectedDistrict)?.name || '';
    const villageName = this.villages().find(v => v.code === this.selectedVillage)?.name || '';

    const config: VillageConfig = {
      id: this.currentConfig()?.id,
      province_code: this.selectedProvince,
      province_name: provinceName,
      regency_code: this.selectedRegency,
      regency_name: regencyName,
      district_code: this.selectedDistrict,
      district_name: districtName,
      village_code: this.selectedVillage,
      village_name: villageName,
      village_head: this.villageForm.village_head || '',
      village_head_nip: this.villageForm.village_head_nip || '',
      village_secretary: this.villageForm.village_secretary || '',
      zip_code: this.villageForm.zip_code || '',
      village_address: this.villageForm.village_address || '',
      village_phone: this.villageForm.village_phone || '',
      village_email: this.villageForm.village_email || '',
      village_logo_url: this.villageForm.village_logo_url || '',
      idm_status: this.villageForm.idm_status || '',
      idm_score: this.villageForm.idm_score || 0,
      dana_desa: this.villageForm.dana_desa || 0,
      created_at: this.currentConfig()?.created_at,
    };

    this.savingConfig.set(true);
    this.configMessage.set('');
    try {
      await this.regionService.saveVillageConfig(config);
      this.isConfigSuccess.set(true);
      this.configMessage.set(`✅ Konfigurasi desa "${villageName}" (${this.selectedVillage}) berhasil disimpan!`);
      this.currentConfig.set(config);
    } catch (err: any) {
      this.isConfigSuccess.set(false);
      this.configMessage.set('Gagal menyimpan konfigurasi: ' + (err.message || err));
    } finally {
      this.savingConfig.set(false);
    }
  }
}

