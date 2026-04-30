import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RegionService } from '../../services/region.service';
import { RegionItem, VillageConfig } from '../../models/data.models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container fade-in">
      <header class="mb-8">
        <h2 class="title-gradient">Pengaturan Sistem</h2>
        <p class="text-muted">Kelola informasi profil, keamanan, dan konfigurasi wilayah desa.</p>
      </header>

      <!-- Tab Navigation -->
      <div class="tab-nav glass-panel mb-8">
        <button [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
          👤 Profil & Keamanan
        </button>
        <button [class.active]="activeTab() === 'village'" (click)="activeTab.set('village')">
          🏘️ Konfigurasi Desa
        </button>
      </div>

      <!-- PROFILE TAB -->
      <div *ngIf="activeTab() === 'profile'" class="settings-grid">
        <!-- Profile Card -->
        <div class="card-luxury glass-panel p-6">
          <div class="section-title mb-6">
            <span class="icon">👤</span>
            <div>
              <h3>Informasi Profil</h3>
              <p class="text-xs text-muted">Nama ini akan muncul di seluruh aplikasi.</p>
            </div>
          </div>

          <form (submit)="updateProfile()">
            <div class="input-group mb-4">
              <label>Nama Lengkap / Display Name</label>
              <input [(ngModel)]="displayName" name="displayName" placeholder="Contoh: Admin DigiWarga" required>
            </div>
            <div class="input-group mb-4" *ngIf="user$ | async as user">
              <label>Email Address</label>
              <input [value]="user.email" disabled class="opacity-50">
              <small class="text-xs text-muted mt-1 italic">* Email tidak dapat diubah secara langsung.</small>
            </div>
            <button type="submit" class="btn-primary w-full" [disabled]="loadingProfile()">
              {{ loadingProfile() ? 'Menyimpan...' : 'Simpan Perubahan Profil' }}
            </button>
          </form>
          
          <div *ngIf="profileMessage()" class="status-msg mt-4" [class.success]="isProfileSuccess()">
            {{ profileMessage() }}
          </div>
        </div>

        <!-- Security Card -->
        <div class="card-luxury glass-panel p-6">
          <div class="section-title mb-6">
            <span class="icon">🔒</span>
            <div>
              <h3>Keamanan & Password</h3>
              <p class="text-xs text-muted">Pastikan password Anda kuat dan rahasia.</p>
            </div>
          </div>

          <form (submit)="changePassword()">
            <div class="input-group mb-4">
              <label>Password Baru</label>
              <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="Minimum 6 karakter" required>
            </div>
            <div class="input-group mb-6">
              <label>Konfirmasi Password</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Ketik ulang password baru" required>
            </div>
            <button type="submit" class="btn-outline w-full" [disabled]="loadingSecurity()">
              {{ loadingSecurity() ? 'Sedang Memproses...' : 'Perbarui Password' }}
            </button>
          </form>

          <div *ngIf="securityMessage()" class="status-msg mt-4" [class.success]="isSecuritySuccess()">
            {{ securityMessage() }}
          </div>
        </div>
      </div>

      <!-- VILLAGE CONFIG TAB -->
      <div *ngIf="activeTab() === 'village'" class="village-config-section">
        
        <!-- Current Village Info (if exists) -->
        <div *ngIf="currentConfig()" class="card-luxury glass-panel p-6 mb-6 village-current">
          <div class="section-title mb-4">
            <span class="icon">📍</span>
            <div>
              <h3>Konfigurasi Aktif</h3>
              <p class="text-xs text-muted">Wilayah desa yang saat ini terdaftar di sistem.</p>
            </div>
          </div>
          <div class="current-info-grid">
            <div class="info-chip">
              <span class="chip-label">Provinsi</span>
              <span class="chip-value">{{ currentConfig()?.province_name }}</span>
              <span class="chip-code">{{ currentConfig()?.province_code }}</span>
            </div>
            <div class="info-chip">
              <span class="chip-label">Kabupaten/Kota</span>
              <span class="chip-value">{{ currentConfig()?.regency_name }}</span>
              <span class="chip-code">{{ currentConfig()?.regency_code }}</span>
            </div>
            <div class="info-chip">
              <span class="chip-label">Kecamatan</span>
              <span class="chip-value">{{ currentConfig()?.district_name }}</span>
              <span class="chip-code">{{ currentConfig()?.district_code }}</span>
            </div>
            <div class="info-chip highlight">
              <span class="chip-label">Desa / Kelurahan</span>
              <span class="chip-value">{{ currentConfig()?.village_name }}</span>
              <span class="chip-code">{{ currentConfig()?.village_code }}</span>
            </div>
          </div>
          <div class="current-meta mt-4" *ngIf="currentConfig()?.village_head || currentConfig()?.village_phone">
            <span *ngIf="currentConfig()?.village_head">🧑‍💼 {{ currentConfig()?.village_head }}</span>
            <span *ngIf="currentConfig()?.village_phone">📞 {{ currentConfig()?.village_phone }}</span>
            <span *ngIf="currentConfig()?.village_email">✉️ {{ currentConfig()?.village_email }}</span>
          </div>
        </div>

        <div class="card-luxury glass-panel p-6">
          <div class="section-title mb-6">
            <span class="icon">🏘️</span>
            <div>
              <h3>{{ currentConfig() ? 'Ubah' : 'Daftarkan' }} Konfigurasi Desa</h3>
              <p class="text-xs text-muted">Pilih wilayah berdasarkan data Kemendagri (API wilayah.id)</p>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div *ngIf="loadingRegion()" class="loading-region">
            <div class="spinner-small"></div>
            <p>Memuat data wilayah dari Kemendagri...</p>
          </div>

          <!-- SMART SEARCH (OTOMATIS) -->
          <div class="smart-search-box mb-6">
            <label>⚡ Cari & Sinkronkan Desa Secara Otomatis</label>
            <div class="search-input-wrapper">
              <input type="text" [(ngModel)]="searchQuery" (input)="onSearchInput()" placeholder="Ketik nama desa... (Contoh: Pangkajene)">
              <div class="search-results-popover" *ngIf="searchResults().length > 0">
                <div class="result-item" *ngFor="let res of searchResults()" (click)="selectSearchResult(res)">
                  <div class="res-name">{{ res.village_name || res.name }}</div>
                  <div class="res-path">{{ res.district_name }} > {{ res.regency_name }} > {{ res.province_name }}</div>
                </div>
              </div>
            </div>
            <p class="text-xs text-muted mt-2 italic">* Pilih desa dari hasil pencarian untuk sinkronisasi otomatis seluruh data wilayah.</p>
          </div>

          <div class="divider-text mb-6"><span>ATAU KONFIGURASI MANUAL</span></div>

          <form (submit)="saveVillageConfig()">
            <div class="region-grid">
              <!-- Provinsi -->
              <div class="input-group">
                <label>
                  Provinsi
                  <span class="badge-count" *ngIf="provinces().length">{{ provinces().length }} data</span>
                </label>
                <select [(ngModel)]="selectedProvince" name="province" (change)="onProvinceChange()" required>
                  <option value="">-- Pilih Provinsi --</option>
                  <option *ngFor="let p of provinces()" [value]="p.code">{{ p.name }}</option>
                </select>
              </div>

              <!-- Kabupaten/Kota -->
              <div class="input-group">
                <label>
                  Kabupaten / Kota
                  <span class="badge-count" *ngIf="regencies().length">{{ regencies().length }} data</span>
                </label>
                <select [(ngModel)]="selectedRegency" name="regency" (change)="onRegencyChange()" required [disabled]="!selectedProvince">
                  <option value="">-- Pilih Kabupaten / Kota --</option>
                  <option *ngFor="let r of regencies()" [value]="r.code">{{ r.name }}</option>
                </select>
              </div>

              <!-- Kecamatan -->
              <div class="input-group">
                <label>
                  Kecamatan
                  <span class="badge-count" *ngIf="districts().length">{{ districts().length }} data</span>
                </label>
                <select [(ngModel)]="selectedDistrict" name="district" (change)="onDistrictChange()" required [disabled]="!selectedRegency">
                  <option value="">-- Pilih Kecamatan --</option>
                  <option *ngFor="let d of districts()" [value]="d.code">{{ d.name }}</option>
                </select>
              </div>

              <!-- Desa/Kelurahan -->
              <div class="input-group">
                <label>
                  Desa / Kelurahan
                  <span class="badge-count" *ngIf="villages().length">{{ villages().length }} data</span>
                </label>
                <select [(ngModel)]="selectedVillage" name="village" required [disabled]="!selectedDistrict">
                  <option value="">-- Pilih Desa / Kelurahan --</option>
                  <option *ngFor="let v of villages()" [value]="v.code">{{ v.name }}</option>
                </select>
              </div>
            </div>

            <!-- Village Detail Fields -->
            <div class="village-detail-section mt-6" *ngIf="selectedVillage">
              <h4 class="mb-4 text-muted">Detail Informasi Desa</h4>
              <div class="region-grid">
                <div class="input-group">
                  <label>Nama Kepala Desa</label>
                  <input [(ngModel)]="villageForm.village_head" name="village_head" placeholder="Nama Kepala Desa">
                </div>
                <div class="input-group">
                  <label>NIP Kepala Desa</label>
                  <input [(ngModel)]="villageForm.village_head_nip" name="village_head_nip" placeholder="NIP (Jika ada)">
                </div>
                <div class="input-group">
                  <label>Sekretaris Desa</label>
                  <input [(ngModel)]="villageForm.village_secretary" name="village_secretary" placeholder="Nama Sekretaris Desa">
                </div>
                <div class="input-group">
                  <label>Kode Pos</label>
                  <input [(ngModel)]="villageForm.zip_code" name="zip_code" placeholder="Contoh: 40171">
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                  <label>Alamat Kantor Desa</label>
                  <input [(ngModel)]="villageForm.village_address" name="village_address" placeholder="Jl. Raya Desa...">
                </div>
                <div class="input-group">
                  <label>No. Telepon Kantor</label>
                  <input [(ngModel)]="villageForm.village_phone" name="village_phone" placeholder="021-xxxxxxx">
                </div>
                <div class="input-group">
                  <label>Email Desa</label>
                  <input [(ngModel)]="villageForm.village_email" name="village_email" placeholder="desa@example.go.id">
                </div>
                <div class="input-group" style="grid-column: 1 / -1;">
                  <label>Logo Resmi Desa (PNG/JPG)</label>
                  <div class="logo-upload-wrapper">
                    <div class="logo-preview" *ngIf="villageForm.village_logo_url || logoPreview()">
                      <img [src]="logoPreview() || villageForm.village_logo_url" alt="Logo Preview">
                    </div>
                    <div class="upload-controls">
                      <input type="file" (change)="onLogoSelected($event)" accept="image/*" #logoInput hidden>
                      <button type="button" class="btn-outline-sm" (click)="logoInput.click()" [disabled]="uploadingLogo()">
                        {{ uploadingLogo() ? 'Mengunggah...' : 'Pilih Logo Desa' }}
                      </button>
                      <p class="text-xs text-muted mt-2">Disarankan background transparan (PNG).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" class="btn-primary w-full mt-6" 
              [disabled]="!selectedVillage || savingConfig()">
              {{ savingConfig() ? 'Menyimpan Konfigurasi...' : '💾 Simpan Konfigurasi Desa' }}
            </button>
          </form>

          <div *ngIf="configMessage()" class="status-msg mt-4" [class.success]="isConfigSuccess()">
            {{ configMessage() }}
          </div>
        </div>
      </div>

      <div class="footer-note mt-8 p-4 text-center glass-panel" *ngIf="user$ | async as user">
        <p class="text-muted text-xs">Login aktif sejak: {{ user.last_sign_in_at | date:'medium' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .tab-nav {
      display: flex;
      gap: 0;
      border-radius: 1rem;
      overflow: hidden;
      padding: 0.25rem;
      button {
        flex: 1;
        padding: 0.85rem 1.5rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        border-radius: 0.75rem;
        transition: all 0.3s ease;
        &:hover { color: #fff; background: rgba(255,255,255,0.05); }
        &.active {
          background: var(--primary);
          color: #fff;
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }
      }
    }
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      .icon {
        font-size: 1.5rem;
        background: rgba(255,255,255,0.05);
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
      }
      h3 { margin: 0; font-size: 1.1rem; }
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label { 
        font-size: 0.8rem; 
        color: var(--text-muted); 
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      input, select {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-color);
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        color: white;
        font-size: 0.95rem;
        transition: all 0.3s;
        &:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
        &:disabled { opacity: 0.35; cursor: not-allowed; }
      }
      select { appearance: none; }
    }
    .btn-outline {
      background: none;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.8rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      &:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.1);
        transform: translateY(-2px);
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .status-msg {
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      font-size: 0.85rem;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
      &.success {
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
    }
    .footer-note {
      border-radius: 1rem;
      opacity: 0.6;
    }
    .w-full { width: 100%; }
    .opacity-50 { opacity: 0.5; }

    /* Village Config Styles */
    .region-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }
    .badge-count {
      font-size: 0.65rem;
      background: rgba(99, 102, 241, 0.15);
      color: var(--primary);
      padding: 0.15rem 0.5rem;
      border-radius: 1rem;
      font-weight: 700;
    }
    .loading-region {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border-radius: 0.75rem;
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.15);
      margin-bottom: 1.5rem;
      p { font-size: 0.85rem; color: var(--text-muted); }
    }
    .spinner-small {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .village-current {
      .current-info-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
      }
      .info-chip {
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border-color);
        border-radius: 0.75rem;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        transition: all 0.3s;
        .chip-label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .chip-value { font-size: 1rem; font-weight: 600; color: #fff; }
        .chip-code { font-size: 0.7rem; color: var(--primary); font-family: monospace; }
        &.highlight {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.08);
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
        }
      }
      .current-meta {
        display: flex;
        gap: 2rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color);
        span { font-size: 0.8rem; color: var(--text-muted); }
      }
    }

    .village-detail-section {
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      h4 { font-size: 0.9rem; font-weight: 600; }
    }

    .logo-upload-wrapper {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      background: rgba(255,255,255,0.03);
      padding: 1rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border-color);
      .logo-preview {
        width: 80px;
        height: 80px;
        background: rgba(0,0,0,0.2);
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        img { max-width: 100%; max-height: 100%; object-fit: contain; }
      }
      .btn-outline-sm {
        background: transparent;
        border: 1px solid var(--primary);
        color: var(--primary);
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        font-size: 0.8rem;
        cursor: pointer;
        &:disabled { opacity: 0.5; }
      }
    }

    .national-data-sync {
      background: rgba(99, 102, 241, 0.05);
      border: 1px solid rgba(99, 102, 241, 0.2);
      .stat-mini {
        label { font-size: 0.65rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem; }
        .val { font-size: 1rem; font-weight: 700; color: #fff; }
      }
    }

    @media (max-width: 768px) {
      .region-grid { grid-template-columns: 1fr; }
      .village-current .current-info-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private regionService = inject(RegionService);
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
    this.kemendesaService.searchVillage(this.searchQuery).subscribe(results => {
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
      this.kemendesaService.getVillageProfile(this.selectedVillage).subscribe(profile => {
        if (profile) {
          this.villageForm.village_head = profile.kepala_desa || this.villageForm.village_head;
          this.villageForm.village_address = profile.alamat || this.villageForm.village_address;
          this.villageForm.village_phone = profile.telepon || this.villageForm.village_phone;
          this.villageForm.village_email = profile.email || this.villageForm.village_email;
        }
      });

      // Sync IDM & Financial Data
      this.kemendesaService.getVillageIdm(this.selectedVillage).subscribe(idm => {
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

