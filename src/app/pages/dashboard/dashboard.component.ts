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
      <header class="welcome-banner card-luxury mb-8 fade-in">
        <div class="flex-between items-center">
          <div class="welcome-text">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="title-gradient text-3xl font-extrabold">Halo, {{ profile.displayName || profile.email?.split('@')?.[0] }}! 👋</h1>
              <div class="live-sync-indicator" title="Realtime Active">
                <span class="pulse-dot"></span>
                <span class="label">LIVE</span>
              </div>
            </div>
            <p class="tagline text-slate-600 font-bold">Akses sistem kependudukan Anda sebagai <span class="badge" [class]="profile.role">{{ profile.role | uppercase }}</span></p>
            <p *ngIf="villageConfig()" class="village-label mt-3 text-primary font-bold">
              📍 {{ villageConfig()?.village_name }} • {{ villageConfig()?.district_name }}
              <span *ngIf="idmStatus()" class="idm-badge ml-3" [attr.data-status]="idmStatus()">IDM: {{ idmStatus() }}</span>
            </p>
          </div>
          
          <section class="territory-filter card-luxury p-6 glass-panel" *ngIf="profile.role !== 'warga'" aria-label="Filter Wilayah">
            <label class="text-[10px] font-extrabold text-primary mb-3 block tracking-widest uppercase">FILTER WILAYAH (RT/RW)</label>
            <select class="custom-select" [ngModel]="selectedRt()" (ngModelChange)="onRtChange($event)">
              <option value="">Seluruh Wilayah Desa</option>
              <option *ngFor="let rt of availableRts()" [value]="rt">{{ rt }}</option>
            </select>
          </section>
        </div>
      </header>

      <ng-container *ngIf="profile.role !== 'warga'">
      <!-- 1. Executive Quick Stats -->
      <section class="quick-stats-grid mb-8 fade-in" aria-label="Statistik Eksekutif">
        <article class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini azure">👥</div>
          <div class="stat-details">
            <span class="label">Total Penduduk</span>
            <div class="flex items-baseline gap-2">
              <span class="value">{{ totalResidents() }}</span>
              <span class="trend-indicator plus">+{{ recentResidentsCount() }}</span>
            </div>
          </div>
        </article>
        <article class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini azure">🏘️</div>
          <div class="stat-details">
            <span class="label">Total Keluarga</span>
            <span class="value">{{ totalFamilies() }}</span>
          </div>
        </article>
        <article class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini azure">📥</div>
          <div class="stat-details">
            <span class="label">Antrian Layanan</span>
            <div class="flex items-baseline gap-2">
              <span class="value">{{ activeRequestsCount() }}</span>
              <span class="trend-indicator" [class.warning]="pendingRequestsCount() > 0">{{ pendingRequestsCount() }} Baru</span>
            </div>
          </div>
        </article>
        <article class="stat-card card-luxury glass-panel">
          <div class="stat-icon-mini azure">📦</div>
          <div class="stat-details">
            <span class="label">Aset Inventaris</span>
            <span class="value">{{ inventoryCount() }}</span>
          </div>
        </article>
      </section>

      <!-- 2. Main Work Area -->
      <main class="dashboard-main-grid fade-in">
        <section class="center-panel">
          <div class="bento-grid">
            <article class="card-luxury analytics-card bento-item">
              <h3 class="bento-title">📊 Demografi Gender</h3>
              <div class="chart-bar-luxury">
                <div class="bar male" [style.width.%]="malePercentage()"></div>
                <div class="bar female" [style.width.%]="femalePercentage()"></div>
              </div>
              <div class="chart-labels mt-4">
                <div class="label"><span class="dot male"></span> <b>{{ malePercentage() }}%</b> Laki-laki</div>
                <div class="label"><span class="dot female"></span> <b>{{ femalePercentage() }}%</b> Perempuan</div>
              </div>
            </article>

            <article class="card-luxury analytics-card bento-item">
              <h3 class="bento-title">📋 Status Layanan</h3>
              <div class="status-funnel mt-2">
                <div class="funnel-item" *ngFor="let s of statusBreakdown().slice(0,3)">
                  <div class="funnel-label-box flex items-center gap-2">
                    <span class="dot" [attr.data-status]="s.label"></span>
                    <label class="text-[10px] font-bold text-slate-500 uppercase">{{ s.label }}</label>
                  </div>
                  <div class="funnel-bar-bg"><div class="funnel-bar" [style.width.%]="s.percent" [attr.data-status]="s.label"></div></div>
                  <span class="count text-slate-800 font-bold">{{ s.count }}</span>
                </div>
              </div>
            </article>

            <article class="card-luxury analytics-card bento-item span-2">
              <h3 class="bento-title">🏘️ Distribusi Wilayah Teraktif</h3>
              <div class="hamlet-grid">
                 <div class="hamlet-item" *ngFor="let h of hamletBreakdown().slice(0,4)">
                    <div class="flex-between mb-2">
                       <span class="name text-slate-700 font-bold text-xs">{{ h.label }}</span>
                       <span class="pct font-extrabold text-primary">{{ h.count }} KK</span>
                    </div>
                    <div class="progress-lite">
                       <div class="bar" [style.width.%]="h.percent"></div>
                    </div>
                 </div>
              </div>
            </article>
          </div>

          <!-- Quick Actions Hub -->
          <section class="quick-actions-hub card-luxury glass-panel mt-8">
            <h3 class="bento-title mb-6">⚡ Pintasan Administrasi</h3>
            <div class="actions-grid">
              <button class="action-btn" routerLink="/families">
                <span class="icon">🏠</span>
                <span class="label">Input KK</span>
              </button>
              <button class="action-btn" routerLink="/services">
                <span class="icon">📄</span>
                <span class="label">Buat Surat</span>
              </button>
              <button class="action-btn" routerLink="/articles">
                <span class="icon">✍️</span>
                <span class="label">Update Berita</span>
              </button>
              <button class="action-btn" routerLink="/import">
                <span class="icon">💾</span>
                <span class="label">Backup</span>
              </button>
            </div>
          </section>
        </section>

        <aside class="side-panel">
          <section class="card-luxury bento-item mb-8">
            <div class="flex-between mb-6">
              <h3 class="bento-title">📥 Antrian Terbaru</h3>
              <button class="btn-text-sm" routerLink="/services">Lihat Semua</button>
            </div>
            <div class="request-list-compact">
              <article *ngFor="let req of latestRequests().slice(0,3)" class="request-item-small card-luxury glass-panel p-3">
                <div class="req-circle" [attr.data-status]="req.status">{{ req.service_type[0] }}</div>
                <div class="req-body">
                   <p class="type text-slate-800 font-bold">{{ req.service_type }}</p>
                   <p class="nik text-[10px] text-muted">{{ req.nik }}</p>
                </div>
                <span class="status-dot" [attr.data-status]="req.status"></span>
              </article>
              <p *ngIf="latestRequests().length === 0" class="text-muted text-center py-6">Antrian kosong.</p>
            </div>
          </section>

          <!-- Finance Widget -->
          <section class="card-luxury budget-widget bento-item" *ngIf="budgetSummary()">
            <div class="flex-between mb-6">
              <h3 class="bento-title">💰 Anggaran APBDes</h3>
              <span class="year-badge">{{ budgetSummary()?.year }}</span>
            </div>
            <div class="finance-display card-luxury bg-slate-50 p-6 mb-6">
              <label class="text-[10px] font-extrabold text-primary mb-2 block tracking-widest">TOTAL PENDAPATAN DESA</label>
              <p class="val text-2xl font-extrabold text-slate-900">Rp {{ budgetSummary()?.income | number }}</p>
            </div>
            <div class="finance-progress">
              <div class="flex-between mb-2">
                <span class="text-xs font-bold text-slate-600">Realisasi Serapan</span>
                <span class="text-sm font-extrabold text-primary">{{ budgetSummary()?.expensePercent | number:'1.0-1' }}%</span>
              </div>
              <div class="progress-lite-large"><div class="bar" [style.width.%]="budgetSummary()?.expensePercent"></div></div>
            </div>
          </section>
        </aside>
      </main>

      <!-- Latest Articles -->
      <section class="articles-dashboard mt-12 fade-in">
         <header class="flex-between mb-8">
           <h3 class="flex items-center gap-3 bento-title">📰 Berita & Pengumuman Desa</h3>
           <button class="btn-outline" routerLink="/articles">Buka Portal Berita ➡️</button>
         </header>
         <div class="articles-grid-mini">
            <article *ngFor="let art of latestArticles()" class="card-luxury art-mini-card" routerLink="/articles">
               <img [src]="art.image_url || 'assets/placeholder.jpg'" alt="News Thumbnail" class="art-img">
               <div class="p-5">
                  <span class="text-[10px] font-extrabold text-primary uppercase tracking-widest">{{ art.created_at | date:'dd MMM yyyy' }}</span>
                  <h4 class="text-slate-800 font-bold mt-2 line-clamp-2">{{ art.title }}</h4>
               </div>
            </article>
         </div>
      </section>
      </ng-container>

      <!-- WARGA VIEW -->
      <ng-container *ngIf="profile.role === 'warga'">
        <main class="dashboard-grid fade-in grid grid-cols-12 gap-8">
          <section class="col-span-4 card-luxury personal-info-card" *ngIf="residentProfile$ | async as resident">
            <header class="flex-between mb-8">
              <h3 class="bento-title">Profil Personal</h3>
              <button class="btn-text-sm" [routerLink]="['/residents', resident.nik]">Detail Profil 👁️</button>
            </header>
            <div class="info-group mb-6">
              <label class="text-[10px] font-bold text-primary tracking-widest uppercase">NOMOR INDUK KEPENDUDUKAN</label>
              <p class="text-xl font-extrabold text-slate-900 nik-cell">{{ resident.nik }}</p>
            </div>
            <div class="info-group mb-6">
              <label class="text-[10px] font-bold text-primary tracking-widest uppercase">NAMA LENGKAP</label>
              <p class="text-lg font-bold text-slate-800">{{ resident.full_name }}</p>
            </div>
            <div class="info-group">
              <label class="text-[10px] font-bold text-primary tracking-widest uppercase">STATUS PEKERJAAN</label>
              <p class="text-slate-700 font-bold">{{ resident.occupation || 'TIDAK TERDEFINISI' }}</p>
            </div>
          </section>

          <section class="col-span-4 card-luxury family-card" *ngIf="familyData$ | async as family">
             <h3 class="bento-title mb-8">Data Keluarga & Domisili</h3>
             <div class="kk-display-badge">No. KK: {{ family.kk_number }}</div>
             <div class="mt-8">
                <label class="text-[10px] font-bold text-primary tracking-widest uppercase mb-2 block">ALAMAT TERDAFTAR</label>
                <p class="text-slate-800 font-bold leading-relaxed">{{ family.address }}</p>
                <p class="text-slate-600 font-medium">RT {{ family.rt || '-' }} / RW {{ family.rw || '-' }} - {{ family.hamlet || '' }}</p>
                <p class="text-slate-600 font-medium">{{ family.district }}</p>
             </div>
             <button class="btn-primary mt-8 w-full" routerLink="/services">Ajukan Layanan Online 📑</button>
          </section>

          <section class="col-span-4 card-luxury requests-card">
             <h3 class="bento-title mb-8">Status Pengajuan Layanan</h3>
             <div class="request-list">
                <article *ngFor="let req of myRequests$ | async" class="request-item-mini mb-4 p-4 card-luxury bg-slate-50 flex-between">
                  <div class="req-info">
                     <p class="text-slate-800 font-bold text-sm">{{ req.service_type }}</p>
                     <p class="text-[10px] text-muted">{{ req.created_at | date:'dd MMM yyyy' }}</p>
                  </div>
                  <span class="badge" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span>
                </article>
                <div *ngIf="(myRequests$ | async)?.length === 0" class="empty-state-mini text-center py-12">
                   <p class="text-muted text-sm font-bold">Belum ada riwayat pengajuan.</p>
                </div>
             </div>
          </section>
        </main>
      </ng-container>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 1rem; }
    .welcome-banner {
      padding: 3.5rem;
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      border: 1px solid var(--glass-border);
    }
    .idm-badge {
      font-size: 0.65rem; font-weight: 900; padding: 0.25rem 0.75rem; border-radius: 2rem; color: white;
      &[data-status='Mandiri'] { background: #10b981; }
      &[data-status='Maju'] { background: #3b82f6; }
      &[data-status='Berkembang'] { background: #f59e0b; }
    }
    .quick-stats-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
      .stat-card {
        display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem;
        .stat-icon-mini { 
          width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
          &.azure { background: rgba(37, 99, 235, 0.05); }
        }
        .stat-details {
          .label { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; display: block; }
          .value { font-size: 1.75rem; font-weight: 800; color: #000; line-height: 1; }
          .trend-indicator { font-size: 0.7rem; font-weight: 800; &.plus { color: #10b981; } &.warning { color: #f59e0b; } }
        }
      }
    }
    .dashboard-main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; }
    .bento-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .span-2 { grid-column: span 2; }
    .bento-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 0.1em; }
    
    .chart-bar-luxury { display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: #f1f5f9; }
    .bar.male { background: #3b82f6; }
    .bar.female { background: #ec4899; }
    .dot { width: 8px; height: 8px; border-radius: 50%; &.male { background: #3b82f6; } &.female { background: #ec4899; } }
    
    .status-funnel { .funnel-item { display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 1rem; margin-bottom: 1rem; } }
    .funnel-bar-bg { height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; .funnel-bar { height: 100%; transition: 0.6s; } }
    .funnel-bar[data-status='Selesai'] { background: #10b981; }
    .funnel-bar[data-status='Diproses'] { background: #3b82f6; }
    .funnel-bar[data-status='Pending'] { background: #f59e0b; }
    
    .progress-lite { height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; .bar { height: 100%; background: var(--primary); } }
    .progress-lite-large { height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden; .bar { height: 100%; background: var(--primary); } }
    
    .action-btn {
      background: #f8fafc; border: 1px solid var(--glass-border); padding: 1.5rem; border-radius: 1.5rem;
      display: flex; flex-direction: column; align-items: center; gap: 1rem; cursor: pointer; transition: all 0.4s var(--apple-ease);
      &:hover { transform: translateY(-5px); background: white; border-color: var(--primary); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
      .icon { font-size: 1.75rem; }
      .label { font-size: 0.75rem; font-weight: 800; color: #000; }
    }
    
    .request-item-small {
      display: flex; align-items: center; gap: 1rem; transition: 0.3s;
      &:hover { border-color: var(--primary); }
      .req-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 900; color: white; }
      .req-circle[data-status='Selesai'] { background: #10b981; }
      .req-circle[data-status='Diproses'] { background: #3b82f6; }
      .req-circle[data-status='Pending'] { background: #f59e0b; }
      .status-dot { width: 10px; height: 10px; border-radius: 50%; &[data-status='Selesai'] { background: #10b981; } &[data-status='Diproses'] { background: #3b82f6; } &[data-status='Pending'] { background: #f59e0b; } }
    }
    
    .art-mini-card { padding: 0; overflow: hidden; transition: 0.4s; &:hover { transform: translateY(-8px); border-color: var(--primary); } .art-img { width: 100%; height: 120px; object-fit: cover; } }
    .kk-display-badge { background: #000; color: white; padding: 0.75rem 1.5rem; border-radius: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 1.25rem; font-weight: 800; display: inline-block; }
    .custom-select { background: white; border: 1px solid var(--glass-border); color: #000; padding: 0.75rem 1.5rem; border-radius: 1rem; font-weight: 700; cursor: pointer; }
    .year-badge { background: var(--primary); color: white; padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 900; }
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
