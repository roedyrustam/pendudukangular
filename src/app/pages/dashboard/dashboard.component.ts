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
      <div class="welcome-banner card-luxury mb-8 fade-in">
        <div class="flex items-center gap-3">
          <h1 class="title-gradient">Selamat Datang, {{ profile.displayName || profile.email?.split('@')?.[0] }}!</h1>
          <div class="live-sync-indicator" title="Realtime Active">
            <span class="pulse-dot"></span>
            <span class="label">LIVE</span>
          </div>
        </div>
        <div class="flex-between">
          <div>
            <p class="tagline">Akses sistem kependudukan Anda sebagai <span class="badge" [class]="profile.role">{{ profile.role | uppercase }}</span></p>
            <p *ngIf="villageConfig()" class="village-label mt-2">
              📍 {{ villageConfig()?.village_name }}, {{ villageConfig()?.district_name }}, {{ villageConfig()?.regency_name }}
              <span class="village-code">{{ villageConfig()?.village_code }}</span>
              <span *ngIf="idmStatus()" class="idm-badge ml-2" [attr.data-status]="idmStatus()">
                IDM: {{ idmStatus() }}
              </span>
            </p>
          </div>
          <div class="territory-filter" *ngIf="profile.role !== 'warga'">
            <label class="text-xs text-muted mr-2">Filter Wilayah (RT/RW):</label>
            <select class="custom-select" [ngModel]="selectedRt()" (ngModelChange)="onRtChange($event)">
              <option value="">Semua Wilayah</option>
              <option *ngFor="let rt of availableRts()" [value]="rt">{{ rt }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- ADMIN & PETUGAS VIEW -->
      <ng-container *ngIf="profile.role !== 'warga'">
        <div class="dashboard-grid fade-in">
          <div class="stat-card card-luxury">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <h3>Total Penduduk</h3>
              <p class="stat-value">{{ totalResidents() }}</p>
              <span class="stat-trend positive">+{{ recentResidentsCount() }} Baru</span>
            </div>
          </div>

          <div class="stat-card card-luxury">
            <div class="stat-icon">🏘️</div>
            <div class="stat-info">
              <h3>Total Keluarga (KK)</h3>
              <p class="stat-value">{{ totalFamilies() }}</p>
              <span class="stat-trend opacity-70">Sistem Terintegrasi</span>
            </div>
          </div>

          <div class="stat-card card-luxury">
            <div class="stat-icon">📥</div>
            <div class="stat-info">
              <h3>Permintaan Layanan</h3>
              <p class="stat-value">{{ activeRequestsCount() }}</p>
              <span class="stat-trend" [class.pending]="pendingRequestsCount() > 0">
                {{ pendingRequestsCount() }} Perlu Diproses
              </span>
            </div>
          </div>
        </div>

        <!-- Analytics Section -->
        <div class="analytics-grid mt-8 fade-in" style="animation-delay: 0.1s">
          <div class="card-luxury analytics-card">
            <h3>📊 Demografi Gender</h3>
            <div class="chart-simple">
              <div class="chart-bar">
                <div class="bar male" [style.width.%]="malePercentage()">
                   <span>Laki-laki ({{ malePercentage() }}%)</span>
                </div>
                <div class="bar female" [style.width.%]="femalePercentage()">
                   <span>Perempuan ({{ femalePercentage() }}%)</span>
                </div>
              </div>
              <div class="chart-labels mt-4">
                <div class="label"><span class="dot male"></span> Laki-laki: {{ maleCount() }}</div>
                <div class="label"><span class="dot female"></span> Perempuan: {{ femaleCount() }}</div>
              </div>
            </div>
          </div>

          <div class="card-luxury analytics-card">
            <h3>📋 Status Pelayanan</h3>
            <div class="status-funnel">
              <div class="funnel-item" *ngFor="let s of statusBreakdown()">
                <label>{{ s.label }}</label>
                <div class="funnel-bar-bg">
                  <div class="funnel-bar" [style.width.%]="s.percent" [attr.data-status]="s.label"></div>
                </div>
                <span class="count">{{ s.count }}</span>
              </div>
            </div>
          </div>

          <div class="card-luxury analytics-card">
            <h3>🏘️ Distribusi Wilayah (Dusun)</h3>
            <div class="hamlet-list">
               <div class="hamlet-item" *ngFor="let h of hamletBreakdown()">
                  <div class="flex-between mb-1">
                     <span class="name">{{ h.label }}</span>
                     <span class="pct">{{ h.count }} KK</span>
                  </div>
                  <div class="progress-lite">
                     <div class="bar" [style.width.%]="h.percent"></div>
                  </div>
               </div>
               <p *ngIf="hamletBreakdown().length === 0" class="text-muted text-xs italic">Data wilayah belum terpetakan.</p>
            </div>
          </div>
        </div>

        <div class="content-main mt-8 fade-in" style="animation-delay: 0.1s">
          <div class="grid-2">
            <div class="card-luxury">
              <div class="flex-between mb-4">
                <h3>Antrian Layanan Terbaru</h3>
                <button class="btn-text" routerLink="/services">Lihat Semua</button>
              </div>
              <div class="request-list">
                <div *ngFor="let req of latestRequests()" class="request-item">
                  <div class="req-info">
                     <span class="req-type">{{ req.service_type }}</span>
                     <span class="req-nik">{{ req.nik }}</span>
                  </div>
                  <span class="badge" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span>
                </div>
                <p *ngIf="latestRequests().length === 0" class="text-muted text-center py-8">Tidak ada antrian aktif.</p>
              </div>
            </div>

            <!-- Budget Mini Widget -->
            <div class="card-luxury budget-widget" *ngIf="budgetSummary()">
              <div class="flex-between mb-4">
                <h3>💰 Realisasi APBDes {{ budgetSummary()?.year }}</h3>
                <button class="btn-text" routerLink="/apbdes">Detail</button>
              </div>
              <div class="budget-stat mb-4">
                <label>Pendapatan</label>
                <div class="flex-between">
                  <span class="val">Rp {{ budgetSummary()?.income | number }}</span>
                  <span class="pct text-xs text-primary">100%</span>
                </div>
                <div class="progress"><div class="bar income" style="width: 100%"></div></div>
              </div>
              <div class="budget-stat">
                <label>Belanja / Pengeluaran</label>
                <div class="flex-between">
                  <span class="val">Rp {{ budgetSummary()?.expense | number }}</span>
                  <span class="pct text-xs text-muted">{{ budgetSummary()?.expensePercent | number:'1.0-1' }}%</span>
                </div>
                <div class="progress"><div class="bar expense" [style.width.%]="budgetSummary()?.expensePercent"></div></div>
              </div>
            </div>

            <!-- Inventory Mini Widget -->
            <div class="card-luxury inventory-mini" *ngIf="inventoryCount() > 0">
               <div class="flex-between mb-4">
                 <h3>📦 Inventaris Aset</h3>
                 <button class="btn-text" routerLink="/inventory">Kelola</button>
               </div>
               <div class="stat-main">
                  <span class="count">{{ inventoryCount() }}</span>
                  <span class="unit">Barang Terdaftar</span>
               </div>
               <p class="text-xs text-muted mt-2">Total Nilai: Rp {{ totalInventoryValue() | number }}</p>
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

        <!-- Developer Tools (Seed Data) -->
        <div class="dev-tools-dashboard mt-12 mb-8 p-6 card-luxury glass-panel" *ngIf="profile.role === 'admin'">
           <div class="flex-between">
              <div>
                 <h4 class="text-primary">🛠️ Developer Tools</h4>
                 <p class="text-xs text-muted">Gunakan alat ini untuk pengujian fungsionalitas CRUD dan visualisasi data.</p>
              </div>
              <div class="flex gap-2">
                 <button class="btn-outline-sm" (click)="seedData()">Tambah 1 Keluarga Sampel</button>
                 <button class="btn-primary-sm" (click)="seedMassiveData()">Tambah 20 Warga & 5 KK</button>
                 <button class="btn-text-sm text-xs" (click)="refreshData()">Paksa Refresh Data</button>
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
    .village-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      .village-code {
        font-family: monospace;
        font-size: 0.7rem;
        background: rgba(99, 102, 241, 0.15);
        color: var(--primary);
        padding: 0.1rem 0.5rem;
        border-radius: 0.25rem;
        margin-left: 0.5rem;
      }
    }
    .idm-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.15rem 0.6rem;
      border-radius: 2rem;
      background: rgba(255,255,255,0.1);
      color: #fff;
      &[data-status='Mandiri'] { background: #10b981; }
      &[data-status='Maju'] { background: #3b82f6; }
      &[data-status='Berkembang'] { background: #f59e0b; }
    }
    .custom-select {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      outline: none;
      & > option { background: var(--darkness); color: white; }
    }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .badge {
      padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 700;
      &.admin { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
      &.petugas { background: rgba(99, 102, 241, 0.2); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.3); }
      &.warga { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    }
    .live-sync-indicator {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 0.25rem 0.6rem;
      border-radius: 1rem;
      .pulse-dot {
        width: 6px;
        height: 6px;
        background-color: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse 1.5s infinite;
      }
      .label {
        font-size: 0.6rem;
        font-weight: 700;
        color: #10b981;
        letter-spacing: 0.05em;
      }
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    .personal-info-card, .family-card, .requests-card { padding: 2rem; }
    .info-item {
      label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      p { font-weight: 600; color: white; }
    }
    .kk-badge { background: var(--primary); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 1rem; display: inline-block; font-weight: 700; }
    .btn-text-sm { background: none; border: none; color: var(--primary); font-size: 0.8rem; font-weight: 600; cursor: pointer; &:hover { text-decoration: underline; } }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .stat-card { display: flex; align-items: center; gap: 1.5rem; }
    .stat-icon { font-size: 2.5rem; background: rgba(255, 255, 255, 0.05); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; }
    .stat-value { font-size: 2.5rem; font-weight: 700; color: var(--primary); line-height: 1; margin: 0.2rem 0; }
    .stat-trend {
      font-size: 0.75rem;
      color: var(--text-muted);
      &.positive { color: #10b981; }
      &.pending { color: #f59e0b; font-weight: 600; }
    }
    .grid-2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
    .request-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .request-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 0.75rem;
      border: 1px solid var(--border-color);
      .req-info { display: flex; flex-direction: column; .req-type { font-weight: 600; font-size: 0.9rem; } .req-nik { font-size: 0.75rem; color: var(--text-muted); font-family: monospace; } }
    }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 1rem;
      font-size: 0.65rem;
      text-transform: uppercase;
      font-weight: 700;
      &.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
      &.diproses { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
      &.selesai { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    }
    .cta-card { display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(30, 41, 59, 0.7) 100%); }
    .btn-outline { background: none; border: 1px solid var(--border-color); color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; cursor: pointer; &:hover { background: rgba(255,255,255,0.05); } }
    .btn-secondary-sm { background: rgba(255,255,255,0.05); color: var(--text-muted); border: 1px solid var(--border-color); padding: 0.4rem 0.8rem; border-radius: 0.4rem; font-size: 0.7rem; cursor: pointer; &:hover { color: white; background: rgba(255,255,255,0.1); } }
    
    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .analytics-card { h3 { font-size: 1rem; margin-bottom: 1.5rem; opacity: 0.8; } }
    
    .chart-bar { display: flex; height: 35px; border-radius: 20px; overflow: hidden; background: rgba(255,255,255,0.05); }
    .bar { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 600; color: white; transition: width 1s ease-out; }
    .bar.male { background: linear-gradient(90deg, #3b82f6, #2563eb); }
    .bar.female { background: linear-gradient(90deg, #ec4899, #db2777); }
    
    .chart-labels { display: flex; justify-content: center; gap: 2rem; .label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; } }
    .dot { width: 10px; height: 10px; border-radius: 50%; &.male { background: #3b82f6; } &.female { background: #ec4899; } }

    .status-funnel { display: flex; flex-direction: column; gap: 1rem; }
    .funnel-item { 
      display: grid; grid-template-columns: 100px 1fr 40px; align-items: center; gap: 1rem;
      label { font-size: 0.8rem; color: var(--text-muted); }
      .funnel-bar-bg { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
      .funnel-bar { 
        height: 100%; transition: width 1s ease-out; 
        &[data-status='Selesai'] { background: #10b981; }
        &[data-status='Diproses'] { background: #3b82f6; }
        &[data-status='Pending'] { background: #f59e0b; }
        &[data-status='Ditolak'] { background: #ef4444; }
      }
      .count { font-weight: 700; font-size: 0.9rem; text-align: right; }
    }

    .budget-widget {
      .budget-stat {
        label { font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.25rem; }
        .val { font-size: 1.1rem; font-weight: 700; }
        .progress { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; margin-top: 0.5rem; overflow: hidden; }
        .bar { height: 100%; &.income { background: #34d399; } &.expense { background: #fb7185; } }
      }
    }

    .inventory-mini {
       .stat-main {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          .count { font-size: 2.5rem; font-weight: 800; color: var(--primary); }
          .unit { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
       }
    }

    .articles-grid-mini {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      .art-mini-card {
        padding: 0;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.3s;
        &:hover { transform: translateY(-5px); border-color: var(--primary); }
        img { width: 100%; height: 100px; object-fit: cover; }
        h4 { font-weight: 600; line-height: 1.3; }
      }
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .text-xs { font-size: 0.7rem; }
    .opacity-70 { opacity: 0.7; }
    .hamlet-list {
       display: flex; flex-direction: column; gap: 1rem;
       .hamlet-item {
          .name { font-size: 0.85rem; font-weight: 500; color: #fff; }
          .pct { font-size: 0.75rem; color: var(--primary); font-weight: 700; }
          .progress-lite {
             height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden;
             .bar { height: 100%; background: linear-gradient(90deg, var(--primary), var(--neon-cyan)); }
          }
       }
    }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .mt-8 { margin-top: 2rem; }
    .mt-12 { margin-top: 3rem; }
    .gap-2 { gap: 0.5rem; }
    .text-primary { color: var(--primary); }
    .dev-tools-dashboard {
       border: 1px dashed var(--primary);
       background: rgba(99, 102, 241, 0.05);
    }
    .btn-primary-sm {
       background: var(--primary);
       color: white;
       border: none;
       padding: 0.35rem 0.75rem;
       border-radius: 0.5rem;
       font-size: 0.75rem;
       font-weight: 600;
       cursor: pointer;
       &:hover { filter: brightness(1.1); }
    }
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
        label: h,
        count: count,
        percent: activeFamilies.length ? (count / activeFamilies.length) * 100 : 0
      };
    });
    this.hamletBreakdown.set(hBreakdown.sort((a, b) => b.count - a.count));
  }

  async seedData() {
    // Get village config for auto-fill
    const vc = this.villageConfig();

    const sampleFamily: Family = {
      kk_number: '327301234567' + Math.floor(Math.random() * 9000 + 1000),
      head_of_family_nik: '327301010170' + Math.floor(Math.random() * 9000 + 1000),
      head_of_family_name: 'Budi Santoso',
      address: 'Jl. Merdeka No. 10',
      rt_rw: '01/05',
      rt: '001',
      rw: '005',
      hamlet: 'Dusun Mekar',
      district: vc?.district_name || 'Cicendo',
      regency: vc?.regency_name || 'Bandung',
      province: vc?.province_name || 'Jawa Barat',
      social_class: 'Sedang',
      created_at: ''
    };

    await this.dataService.addFamily(sampleFamily);
    await this.dataService.addResident({
      nik: sampleFamily.head_of_family_nik!,
      family_id: sampleFamily.kk_number,
      full_name: 'Budi Santoso',
      birth_place: 'Bandung',
      birth_date: '1970-01-01',
      gender: 'Laki-laki',
      occupation: 'Wiraswasta',
      relationship: 'Kepala Keluarga',
      religion: 'Islam',
      education: 'SMA/Sederajat',
      marital_status: 'Kawin',
      blood_type: 'O',
      citizenship: 'WNI',
      father_name: 'Ahmad Santoso',
      mother_name: 'Siti Aminah',
      address: sampleFamily.address,
      created_at: ''
    });

    alert('Data sample berhasil ditambahkan!');
  }
}
