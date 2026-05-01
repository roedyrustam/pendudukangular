import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { RegionService } from '../../services/region.service';
import { KemendesaService } from '../../services/kemendesa.service';
import { ServiceRequest, AppUser, Resident, Family, VillageConfig, Article, APBDes } from '../../models/data.models';
import { AuthService } from '../../services/auth.service';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="dashboard-container" *ngIf="userProfile$ | async as profile">
      <div class="welcome-banner card-luxury mb-6 fade-in">
        <div class="flex-between items-center">
          <div class="welcome-text">
            <div class="flex items-center gap-3 mb-1">
              <h1 class="title-gradient">Halo, {{ profile.displayName || profile.email?.split('@')?.[0] }}!</h1>
              <div class="live-sync-indicator" title="Realtime Active">
                <span class="pulse-dot"></span>
                <span class="label">LIVE</span>
              </div>
            </div>
            <p class="tagline">Akses sistem kependudukan Anda sebagai <span class="badge" [class]="profile.role">{{ profile.role | uppercase }}</span></p>
            <p *ngIf="villageConfig()" class="village-label mt-2">
              📍 {{ villageConfig()?.village_name }} • {{ villageConfig()?.district_name }}
              <span *ngIf="idmStatus()" class="idm-badge ml-2" [attr.data-status]="idmStatus()">IDM: {{ idmStatus() }}</span>
            </p>
          </div>
          
          <div class="territory-filter card-luxury p-4 glass-panel" *ngIf="profile.role !== 'warga'">
            <label class="text-xs text-muted mb-2 block">Pilih Wilayah (RT/RW):</label>
            <select class="custom-select" [ngModel]="selectedRt()" (ngModelChange)="onRtChange($event)">
              <option value="">Semua Wilayah</option>
              <option *ngFor="let rt of availableRts()" [value]="rt">{{ rt }}</option>
            </select>
          </div>
        </div>
      </div>

      <ng-container *ngIf="profile.role !== 'warga'">
      <!-- 1. Executive Quick Stats (4-Column) -->
      <div class="quick-stats-grid mb-6 fade-in">
        <div class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini">👥</div>
          <div class="stat-details">
            <span class="label">Total Penduduk</span>
            <div class="flex items-baseline gap-2">
              <span class="value">{{ totalResidents() }}</span>
              <span class="trend text-success">+{{ recentResidentsCount() }}</span>
            </div>
          </div>
        </div>
        <div class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini">🏘️</div>
          <div class="stat-details">
            <span class="label">Total KK</span>
            <span class="value">{{ totalFamilies() }}</span>
          </div>
        </div>
        <div class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini">📥</div>
          <div class="stat-details">
            <span class="label">Antrian Layanan</span>
            <div class="flex items-baseline gap-2">
              <span class="value">{{ activeRequestsCount() }}</span>
              <span class="trend" [class.pending]="pendingRequestsCount() > 0">{{ pendingRequestsCount() }} Baru</span>
            </div>
          </div>
        </div>
        <div class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini">📦</div>
          <div class="stat-details">
            <span class="label">Aset Desa</span>
            <span class="value">{{ inventoryCount() }}</span>
          </div>
        </div>
      </div>

      <!-- 2. Main Work Area (Grid 2/3 & 1/3) -->
      <div class="dashboard-main-grid fade-in">
        <!-- Center Panel: Analytics & Maps -->
        <div class="center-panel">
          <div class="bento-grid">
            <div class="card-luxury analytics-card bento-item">
              <h3>📊 Demografi Gender</h3>
              <div class="chart-bar">
                <div class="bar male" [style.width.%]="malePercentage()"></div>
                <div class="bar female" [style.width.%]="femalePercentage()"></div>
              </div>
              <div class="chart-labels mt-4">
                <div class="label"><span class="dot male"></span> {{ malePercentage() }}% Laki-laki</div>
                <div class="label"><span class="dot female"></span> {{ femalePercentage() }}% Perempuan</div>
              </div>
            </div>

            <div class="card-luxury analytics-card bento-item">
              <h3>📋 Status Layanan</h3>
              <div class="status-funnel">
                <div class="funnel-item" *ngFor="let s of statusBreakdown().slice(0,3)">
                  <div class="funnel-label-box flex items-center gap-2">
                    <span class="dot" [attr.data-status]="s.label"></span>
                    <label class="text-xs">{{ s.label }}</label>
                  </div>
                  <div class="funnel-bar-bg"><div class="funnel-bar" [style.width.%]="s.percent" [attr.data-status]="s.label"></div></div>
                  <span class="count text-xs">{{ s.count }}</span>
                </div>
              </div>
            </div>

            <div class="card-luxury analytics-card bento-item span-2">
              <h3>🏘️ Distribusi Wilayah</h3>
              <div class="hamlet-grid">
                 <div class="hamlet-item" *ngFor="let h of hamletBreakdown().slice(0,4)">
                    <div class="flex-between mb-1">
                       <span class="name text-xs">{{ h.label }}</span>
                       <span class="pct text-xs">{{ h.count }} KK</span>
                    </div>
                    <div class="progress-lite">
                       <div class="bar" [style.width.%]="h.percent"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions Hub -->
          <div class="quick-actions-hub card-luxury glass-panel mt-6">
            <h3>⚡ Akses Cepat</h3>
            <div class="actions-grid">
              <button class="action-btn" routerLink="/families">
                <span class="icon">➕</span>
                <span>Tambah KK</span>
              </button>
              <button class="action-btn" routerLink="/services">
                <span class="icon">📄</span>
                <span>Buat Surat</span>
              </button>
              <button class="action-btn" routerLink="/articles">
                <span class="icon">✍️</span>
                <span>Tulis Berita</span>
              </button>
              <button class="action-btn" routerLink="/import">
                <span class="icon">💾</span>
                <span>Backup Data</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Side Panel: Urgent & Finance -->
        <div class="side-panel">
          <div class="card-luxury bento-item mb-6">
            <div class="flex-between mb-4">
              <h3>📥 Aktivitas Layanan</h3>
              <button class="btn-text-sm" routerLink="/services">Semua</button>
            </div>
            <div class="request-list-compact">
              <div *ngFor="let req of latestRequests().slice(0,3)" class="request-item-small">
                <div class="req-circle" [attr.data-status]="req.status">{{ req.service_type[0] }}</div>
                <div class="req-body">
                   <p class="type">{{ req.service_type }}</p>
                   <p class="nik">{{ req.nik }}</p>
                </div>
                <span class="status-icon" [attr.data-status]="req.status"></span>
              </div>
              <p *ngIf="latestRequests().length === 0" class="text-muted text-center py-4">Antrian kosong.</p>
            </div>
          </div>

          <!-- Finance Widget -->
          <div class="card-luxury budget-widget bento-item" *ngIf="budgetSummary()">
            <div class="flex-between mb-4">
              <h3>💰 Realisasi APBDes</h3>
              <span class="year-badge">{{ budgetSummary()?.year }}</span>
            </div>
            <div class="finance-card glass-panel p-4 mb-4">
              <label class="text-[10px] text-muted">TOTAL PENDAPATAN</label>
              <p class="val text-lg">Rp {{ budgetSummary()?.income | number }}</p>
            </div>
            <div class="finance-progress">
              <div class="flex-between mb-1">
                <span class="text-xs">Persentase Serapan</span>
                <span class="text-xs font-bold text-primary">{{ budgetSummary()?.expensePercent | number:'1.0-1' }}%</span>
              </div>
              <div class="progress-lite"><div class="bar" [style.width.%]="budgetSummary()?.expensePercent"></div></div>
            </div>
          </div>
        </div>
      </div>

        <!-- Latest Articles / Portal Desa -->
        <div class="articles-dashboard mt-8 fade-in" style="animation-delay: 0.2s">
           <div class="flex-between mb-4">
             <h3 class="flex items-center gap-2">📰 Berita & Pengumuman Desa</h3>
             <button class="btn-text" routerLink="/articles">Ke Portal Berita</button>
           </div>
           <div class="articles-grid-mini">
              <div *ngFor="let art of latestArticles()" class="card-luxury glass-panel art-mini-card" routerLink="/articles">
                 <img [src]="art.image_url || 'assets/placeholder.jpg'" alt="News">
                 <div class="p-3">
                    <span class="text-xs text-muted">{{ art.created_at | date:'dd MMM' }}</span>
                    <h4 class="text-sm mt-1 line-clamp-2">{{ art.title }}</h4>
                 </div>
              </div>
           </div>
        </div>

      </ng-container>

      <!-- WARGA VIEW -->
      <ng-container *ngIf="profile.role === 'warga'">
        <div class="dashboard-grid fade-in">
          <div class="card-luxury personal-info-card" *ngIf="residentProfile$ | async as resident">
            <div class="flex-between mb-4">
              <h3>Profil Saya</h3>
              <button class="btn-text-sm" [routerLink]="['/residents', resident.nik]">Detail Lengkap</button>
            </div>
            <div class="info-item">
              <label>NIK</label>
              <p>{{ resident.nik }}</p>
            </div>
            <div class="info-item mt-2">
              <label>Nama Lengkap</label>
              <p>{{ resident.full_name }}</p>
            </div>
            <div class="info-item mt-2">
              <label>Pekerjaan</label>
              <p>{{ resident.occupation }}</p>
            </div>
          </div>

          <div class="card-luxury family-card" *ngIf="familyData$ | async as family">
             <h3>Data Keluarga</h3>
             <div class="kk-badge mt-2">No. KK: {{ family.kk_number }}</div>
             <p class="text-xs text-muted mt-4">Alamat Terdaftar:</p>
             <p class="text-sm">{{ family.address }}</p>
             <p class="text-sm">RT {{ family.rt || '-' }}/RW {{ family.rw || '-' }} - {{ family.hamlet || '' }} {{ family.district }}</p>
             <button class="btn-primary mt-6 w-full" routerLink="/services">Ajukan Layanan Baru</button>
          </div>

          <div class="card-luxury requests-card">
             <h3>Pengajuan Saya</h3>
             <div class="request-list mt-4">
                <div *ngFor="let req of myRequests$ | async" class="request-item">
                  <div class="req-info">
                     <span class="req-type">{{ req.service_type }}</span>
                      <span class="req-date text-xs text-muted">{{ req.created_at | date:'dd MMM yyyy' }}</span>
                  </div>
                  <span class="badge" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span>
                </div>
                <p *ngIf="(myRequests$ | async)?.length === 0" class="text-xs text-muted text-center py-4">Belum ada pengajuan.</p>
             </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .welcome-banner {
      padding: 3rem;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%);
      h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    }
    .idm-badge {
      font-size: 0.7rem; font-weight: 800; padding: 0.15rem 0.6rem; border-radius: 2rem;
      &[data-status='Mandiri'] { background: #10b981; }
      &[data-status='Maju'] { background: #3b82f6; }
      &[data-status='Berkembang'] { background: #f59e0b; }
    }
    .quick-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
      .stat-card {
        display: flex; align-items: center; gap: 1rem; padding: 1.25rem;
        .stat-icon-mini { font-size: 1.5rem; background: rgba(255,255,255,0.05); width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 0.75rem; }
        .stat-details {
          .label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; display: block; margin-bottom: 0.15rem; }
          .value { font-size: 1.4rem; font-weight: 800; color: var(--primary); line-height: 1; }
          .trend { font-size: 0.7rem; font-weight: 700; &.pending { color: #f59e0b; } }
          .text-success { color: #10b981; }
        }
      }
    }
    .dashboard-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .span-2 { grid-column: span 2; }
    .analytics-card { h3 { font-size: 0.85rem; margin-bottom: 1rem; opacity: 0.7; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; } }
    .quick-actions-hub {
      padding: 1.5rem;
      h3 { font-size: 0.85rem; margin-bottom: 1.25rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
      .actions-grid {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
        .action-btn {
          background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 1rem; border-radius: 1rem;
          display: flex; flex-direction: column; align-items: center; gap: 0.75rem; cursor: pointer; transition: all 0.3s;
          &:hover { background: var(--primary-glow); border-color: var(--primary); transform: translateY(-3px); }
          .icon { font-size: 1.5rem; }
          span:not(.icon) { font-size: 0.75rem; font-weight: 600; color: white; }
        }
      }
    }
    .request-list-compact {
      display: flex; flex-direction: column; gap: 0.75rem;
      .request-item-small {
        display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: rgba(255,255,255,0.02); border-radius: 0.75rem; border: 1px solid var(--border-color);
        .req-circle {
           width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;
           &[data-status='Selesai'] { background: #10b981; color: white; }
           &[data-status='Diproses'] { background: #3b82f6; color: white; }
           &[data-status='Pending'] { background: #f59e0b; color: white; }
        }
        .req-body { flex: 1; .type { font-size: 0.8rem; font-weight: 600; margin: 0; } .nik { font-size: 0.65rem; color: var(--text-muted); font-family: monospace; } }
        .status-icon { width: 8px; height: 8px; border-radius: 50%; &[data-status='Selesai'] { background: #10b981; box-shadow: 0 0 8px #10b981; } &[data-status='Diproses'] { background: #3b82f6; box-shadow: 0 0 8px #3b82f6; } &[data-status='Pending'] { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; } }
      }
    }
    .finance-card { background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)); border-radius: 1rem; .val { font-family: monospace; font-weight: 700; color: #fff; } }
    .year-badge { background: var(--primary); color: white; padding: 0.15rem 0.5rem; border-radius: 0.5rem; font-size: 0.65rem; font-weight: 800; }
    .chart-bar { display: flex; height: 10px; border-radius: 5px; overflow: hidden; background: rgba(255,255,255,0.05); }
    .bar.male { background: #3b82f6; }
    .bar.female { background: #ec4899; }
    .dot { width: 8px; height: 8px; border-radius: 50%; &.male { background: #3b82f6; } &.female { background: #ec4899; } }
    .label { font-size: 0.75rem; display: flex; align-items: center; gap: 0.4rem; }
    .status-funnel { display: flex; flex-direction: column; gap: 0.75rem; }
    .funnel-item { 
      display: grid; grid-template-columns: 80px 1fr 30px; align-items: center; gap: 0.75rem;
      label { font-size: 0.75rem; color: var(--text-muted); }
      .funnel-bar-bg { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; }
      .funnel-bar { height: 100%; &[data-status='Selesai'] { background: #10b981; } &[data-status='Diproses'] { background: #3b82f6; } &[data-status='Pending'] { background: #f59e0b; } }
      .count { font-weight: 700; font-size: 0.8rem; text-align: right; }
    }
    .hamlet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .progress-lite { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; .bar { height: 100%; background: var(--primary); } }
    @media (max-width: 1200px) { .dashboard-main-grid { grid-template-columns: 1.5fr 1fr; } }
    @media (max-width: 1080px) { .quick-stats-grid { grid-template-columns: 1fr 1fr; } .dashboard-main-grid { grid-template-columns: 1fr; } .quick-actions-hub .actions-grid { grid-template-columns: 1fr 1fr; } }
    .articles-grid-mini { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; .art-mini-card { padding: 0; overflow: hidden; cursor: pointer; transition: transform 0.3s; &:hover { transform: translateY(-5px); border-color: var(--primary); } img { width: 100%; height: 80px; object-fit: cover; } h4 { font-weight: 600; line-height: 1.3; font-size: 0.8rem; } } }
    .dev-tools-dashboard { border: 1px dashed var(--primary); background: rgba(99, 102, 241, 0.05); }
    .btn-primary-sm { background: var(--primary); color: white; border: none; padding: 0.35rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; }
    .badge {
      padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700;
      &.admin { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
      &.petugas { background: rgba(99, 102, 241, 0.2); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
      &.warga { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    }
    .live-sync-indicator {
      display: flex; align-items: center; gap: 0.4rem; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); padding: 0.25rem 0.6rem; border-radius: 1rem;
      .pulse-dot { width: 6px; height: 6px; background-color: #10b981; border-radius: 50%; animation: pulse 1.5s infinite; }
      .label { font-size: 0.6rem; font-weight: 700; color: #10b981; }
    }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .custom-select { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 0.4rem 0.8rem; border-radius: 0.5rem; font-size: 0.85rem; outline: none; }
    .personal-info-card, .family-card, .requests-card { padding: 2rem; }
    .info-item { label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; } p { font-weight: 600; color: white; } }
    .kk-badge { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 1rem; display: inline-block; font-weight: 700; }
    .btn-text-sm { background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
  `]
})
export class DashboardComponent implements OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private regionService = inject(RegionService);
  private kemendesaService = inject(KemendesaService);

  userProfile$ = this.authService.userData$;
  villageConfig = signal<VillageConfig | null>(null);
  idmStatus = signal<string>('');
  
  // Warga Specific Data
  residentProfile$: Observable<Resident | undefined> = this.userProfile$.pipe(
    switchMap(u => u?.nik ? this.dataService.getResident(u.nik) : of(undefined))
  );

  familyData$: Observable<Family | undefined> = this.residentProfile$.pipe(
    switchMap(r => r?.family_id ? this.dataService.getFamily(r.family_id) : of(undefined))
  );

  myRequests$: Observable<ServiceRequest[]> = this.userProfile$.pipe(
    switchMap(u => u?.nik ? this.dataService.getResidentRequests(u.nik) : of([]))
  );

  totalResidents = signal(0);
  totalFamilies = signal(0);
  activeRequestsCount = signal(0);
  pendingRequestsCount = signal(0);
  recentResidentsCount = signal(0);
  latestRequests = signal<ServiceRequest[]>([]);
  latestArticles = signal<Article[]>([]);
  budgetSummary = signal<{year: number, income: number, expense: number, expensePercent: number} | null>(null);
  inventoryCount = signal(0);
  totalInventoryValue = signal(0);

  // Analytics
  maleCount = signal(0);
  femaleCount = signal(0);
  malePercentage = signal(0);
  femalePercentage = signal(0);
  statusBreakdown = signal<{label: string, count: number, percent: number}[]>([]);
  hamletBreakdown = signal<{label: string, count: number, percent: number}[]>([]);

  // Raw Data for Filtering
  rawFamilies: Family[] = [];
  rawResidents: Resident[] = [];
  rawRequests: ServiceRequest[] = [];
  
  availableRts = signal<string[]>([]);
  selectedRt = signal<string>('');
  private subscriptions: any[] = [];

  constructor() {
    combineLatest([
      this.dataService.getFamilies(),
      this.dataService.getResidents(),
      this.dataService.getRequests()
    ]).subscribe(([families, residents, requests]) => {
      this.rawFamilies = families;
      this.rawResidents = residents;
      this.rawRequests = requests;
      
      const rts = Array.from(new Set(families.map(f => f.rt_rw).filter(Boolean)));
      this.availableRts.set(rts.sort());
      
      this.applyAnalytics();
    });

    // Update stats from server-side count for accuracy
    this.dataService.getQuickStats().then(stats => {
      this.totalResidents.set(stats.residents);
      this.totalFamilies.set(stats.families);
      this.activeRequestsCount.set(stats.requests);
      this.pendingRequestsCount.set(stats.pending);
    });

    // Realtime Subscriptions
    this.subscriptions.push(
      this.dataService.subscribeToRequests((payload) => {
        console.log('Realtime Request Update:', payload);
        this.refreshData();
      })
    );
    this.subscriptions.push(
      this.dataService.subscribeToResidents((payload) => {
        console.log('Realtime Resident Update:', payload);
        this.refreshData();
      })
    );

    // Load Village Config
    this.regionService.getVillageConfig().subscribe(config => {
      if (config) {
        this.villageConfig.set(config);
        // Fetch IDM Status from Kemendesa
        this.kemendesaService.getVillageIdm(config.village_code).subscribe(res => {
          if (res && res.status) this.idmStatus.set(res.status);
          // Fallback demo status if API is mock or failing
          else if (!this.idmStatus()) this.idmStatus.set('Mandiri');
        });
      }
    });

    // Load Articles
    this.dataService.getArticles().subscribe(data => {
      this.latestArticles.set(data.slice(0, 4));
    });

    // Load Budget
    this.dataService.getAPBDes(new Date().getFullYear()).subscribe(data => {
      if (data.length > 0) {
        const income = data.filter(i => i.type === 1).reduce((acc, curr) => acc + curr.amount, 0);
        const expense = data.filter(i => i.type === 2).reduce((acc, curr) => acc + curr.amount, 0);
        this.budgetSummary.set({
          year: new Date().getFullYear(),
          income,
          expense,
          expensePercent: income > 0 ? (expense / income) * 100 : 0
        });
      }
    });

    // Load Inventory
    this.dataService.getInventory().subscribe(items => {
      this.inventoryCount.set(items.length);
      this.totalInventoryValue.set(items.reduce((acc, curr) => acc + (curr.price || 0) * curr.quantity, 0));
    });
  }

  refreshData() {
    combineLatest([
      this.dataService.getFamilies(),
      this.dataService.getResidents(),
      this.dataService.getRequests()
    ]).subscribe(([families, residents, requests]) => {
      this.rawFamilies = families;
      this.rawResidents = residents;
      this.rawRequests = requests;
      this.applyAnalytics();
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  onRtChange(rt: string) {
    this.selectedRt.set(rt);
    this.applyAnalytics();
  }

  applyAnalytics() {
    const currentRt = this.selectedRt();
    
    // Filter Families
    const activeFamilies = currentRt ? this.rawFamilies.filter(f => f.rt_rw === currentRt) : this.rawFamilies;
    this.totalFamilies.set(activeFamilies.length);
    
    // Map family IDs for Resident filtering
    const activeKkList = activeFamilies.map(f => f.kk_number);
    
    // Filter Residents
    const activeResidents = currentRt ? this.rawResidents.filter(r => activeKkList.includes(r.family_id)) : this.rawResidents;
    this.totalResidents.set(activeResidents.length);

    // Filter Requests (by joining resident -> requested by)
    const activeResidentNiks = activeResidents.map(r => r.nik);
    const activeReqs = currentRt ? this.rawRequests.filter(req => activeResidentNiks.includes(req.nik)) : this.rawRequests;

    // Recalculate Metrics for Residents
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = activeResidents.filter(r => {
      const createdAt = new Date(r.created_at as any);
      return createdAt >= thirtyDaysAgo;
    });
    this.recentResidentsCount.set(recent.length);

    const males = activeResidents.filter(r => r.gender === 'Laki-laki').length;
    const females = activeResidents.length - males;
    this.maleCount.set(males);
    this.femaleCount.set(females);
    this.malePercentage.set(activeResidents.length ? Math.round((males / activeResidents.length) * 100) : 50);
    this.femalePercentage.set(activeResidents.length ? 100 - this.malePercentage() : 50);

    // Recalculate Metrics for Requests
    this.activeRequestsCount.set(activeReqs.length);
    this.pendingRequestsCount.set(activeReqs.filter(r => r.status === 'Pending').length);
    this.latestRequests.set(activeReqs.slice(0, 5));

    const statuses = ['Selesai', 'Diproses', 'Pending', 'Ditolak'];
    const breakdown = statuses.map(s => {
      const count = activeReqs.filter(r => r.status === s).length;
      return {
        label: s,
        count: count,
        percent: activeReqs.length ? (count / activeReqs.length) * 100 : 0
      };
    });
    this.statusBreakdown.set(breakdown);

    // Hamlet Analytics
    const hamlets = Array.from(new Set(activeFamilies.map(f => f.hamlet).filter(Boolean)));
    const hBreakdown = hamlets.map(h => {
      const count = activeFamilies.filter(f => f.hamlet === h).length;
      return {
        label: h as string,
        count: count,
        percent: activeFamilies.length ? (count / activeFamilies.length) * 100 : 0
      };
    });
    this.hamletBreakdown.set(hBreakdown.sort((a, b) => b.count - a.count));
  }

}
