import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServiceRequest, AppUser, Resident, Family } from '../../models/data.models';
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
          <p class="tagline">Akses sistem kependudukan Anda sebagai <span class="badge" [class]="profile.role">{{ profile.role | uppercase }}</span></p>
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

            <div class="card-luxury cta-card">
              <div class="cta-content">
                 <h3>Siap mengelola data?</h3>
                 <p class="text-muted mb-6">Mulai pendataan warga baru atau kelola kartu keluarga yang sudah ada dengan mudah.</p>
                 <div class="flex gap-2">
                    <button class="btn-primary" routerLink="/families">Kelola Keluarga</button>
                    <button class="btn-outline" routerLink="/residents">Cari Penduduk</button>
                 </div>
              </div>
              <div class="dev-tools mt-8">
                <p class="text-xs text-muted mb-2">DEVELOPER TOOLS</p>
                <button class="btn-secondary-sm" (click)="seedData()">Seed Sample Data</button>
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
             <p class="text-sm">{{ family.rt_rw }} - {{ family.district }}</p>
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

    .text-xs { font-size: 0.7rem; }
    .opacity-70 { opacity: 0.7; }
    .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
    .mt-8 { margin-top: 2rem; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class DashboardComponent implements OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);

  userProfile$ = this.authService.userData$;
  
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

  // Analytics
  maleCount = signal(0);
  femaleCount = signal(0);
  malePercentage = signal(0);
  femalePercentage = signal(0);
  statusBreakdown = signal<{label: string, count: number, percent: number}[]>([]);

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
  }

  async seedData() {
    const sampleFamily = {
      kk_number: '327301234567' + Math.floor(Math.random() * 9000 + 1000),
      head_of_family_name: 'Budi Santoso',
      address: 'Jl. Merdeka No. 10',
      rt_rw: '01/05',
      district: 'Cicendo',
      regency: 'Bandung',
      province: 'Jawa Barat',
      created_at: ''
    };

    await this.dataService.addFamily(sampleFamily);
    await this.dataService.addResident({
      nik: '327301010170' + Math.floor(Math.random() * 9000 + 1000),
      family_id: sampleFamily.kk_number,
      full_name: 'Budi Santoso',
      birth_place: 'Bandung',
      birth_date: '1970-01-01',
      gender: 'Laki-laki',
      occupation: 'Wiraswasta',
      relationship: 'Kepala Keluarga',
      created_at: ''
    });

    alert('Data sample berhasil ditambahkan!');
  }
}
