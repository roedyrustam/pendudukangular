import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Family, Resident } from '../../models/data.models';

@Component({
  selector: 'app-region-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-actions mb-6">
      <div class="titles">
        <h2 class="title-gradient">Wawasan Wilayah</h2>
        <p class="text-muted">Analisis demografi dan distribusi penduduk berdasarkan RT/RW</p>
      </div>
    </div>

    <div class="insights-grid">
      <!-- RT/RW Distribution -->
      <div class="card-luxury insight-card">
        <h3>🏘️ Distribusi Keluarga per RT/RW</h3>
        <div class="scroll-area">
          <div *ngFor="let r of regionStats()" class="region-row">
            <div class="row-header">
              <span class="region-label">{{ r.name }}</span>
              <span class="row-count">{{ r.familyCount }} KK</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" [style.width.%]="r.familyPercent"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- District Stats -->
      <div class="card-luxury insight-card">
        <h3>📍 Sebaran per Kecamatan</h3>
        <div class="scroll-area">
          <div *ngFor="let d of districtStats()" class="region-row">
            <div class="row-header">
              <span class="region-label">{{ d.name }}</span>
              <span class="row-count">{{ d.residentCount }} Jiwa</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar alt" [style.width.%]="d.residentPercent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="stats-overview mt-8">
      <div class="stat-mini-card card-luxury">
        <label>Rata-rata Anggota per KK</label>
        <p>{{ avgMembersPerFamily() }}</p>
      </div>
      <div class="stat-mini-card card-luxury">
        <label>Total RT/RW Terdaftar</label>
        <p>{{ totalRegions() }}</p>
      </div>
      <div class="stat-mini-card card-luxury">
        <label>Kepadatan Tertinggi</label>
        <p>{{ densestRegion() }}</p>
      </div>
    </div>

    <!-- Advanced Demographics -->
    <div class="insights-grid mt-8">
       <!-- Age Groups -->
       <div class="card-luxury insight-card">
          <h3>👶 Distribusi Kelompok Usia</h3>
          <div class="scroll-area">
             <div *ngFor="let a of ageStats()" class="region-row">
                <div class="row-header">
                   <span class="region-label">{{ a.label }}</span>
                   <span class="row-count">{{ a.count }} Jiwa</span>
                </div>
                <div class="progress-container">
                   <div class="progress-bar" [style.width.%]="a.percent" [style.background]="a.color"></div>
                </div>
             </div>
          </div>
       </div>

       <!-- Education -->
       <div class="card-luxury insight-card">
          <h3>🎓 Tingkat Pendidikan</h3>
          <div class="scroll-area">
             <div *ngFor="let e of educationStats()" class="region-row">
                <div class="row-header">
                   <span class="region-label">{{ e.label }}</span>
                   <span class="row-count">{{ e.count }}</span>
                </div>
                <div class="progress-container">
                   <div class="progress-bar alt" [style.width.%]="e.percent"></div>
                </div>
             </div>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .insight-card { 
      height: 420px; display: flex; flex-direction: column; 
      padding: 2.5rem;
      h3 { font-size: 1.25rem; font-weight: 800; color: #000000; margin-bottom: 2rem; letter-spacing: -0.02em; }
    }
    .scroll-area { flex: 1; overflow-y: auto; padding-right: 0.75rem; }
    
    .region-row { 
      margin-bottom: 1.5rem;
      .row-header { display: flex; justify-content: space-between; margin-bottom: 0.6rem; font-size: 0.9rem; }
      .region-label { font-weight: 700; color: #1e293b; }
      .row-count { color: #2563eb; font-weight: 800; font-family: 'JetBrains Mono', monospace; }
    }
    
    .progress-container { height: 10px; background: #f1f5f9; border-radius: 6px; overflow: hidden; }
    .progress-bar { 
      height: 100%; background: linear-gradient(90deg, #2563eb, #60a5fa); border-radius: 6px; transition: width 1s ease;
      &.alt { background: linear-gradient(90deg, #1e293b, #475569); }
    }
    
    .stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .stat-mini-card { 
      padding: 2rem;
      label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; }
      p { font-size: 2.5rem; font-weight: 900; color: #000000; margin-top: 0.5rem; letter-spacing: -0.04em; }
    }
    
    .mt-8 { margin-top: 2.5rem; }

    @media (max-width: 1024px) {
      .insights-grid { grid-template-columns: 1fr; }
      .stats-overview { grid-template-columns: 1fr; }
    }
  `]
})
export class RegionInsightsComponent implements OnDestroy {
  private dataService = inject(DataService);
  
  regionStats = signal<any[]>([]);
  districtStats = signal<any[]>([]);
  avgMembersPerFamily = signal('0');
  totalRegions = signal(0);
  densestRegion = signal('-');
  
  ageStats = signal<any[]>([]);
  educationStats = signal<any[]>([]);
  religionStats = signal<any[]>([]);
  private subscriptions: any[] = [];

  constructor() {
    this.refreshStats();

    // Realtime Subscriptions
    this.subscriptions.push(
      this.dataService.subscribeToResidents(() => this.refreshStats())
    );
    this.subscriptions.push(
      this.dataService.subscribeToRequests(() => this.refreshStats())
    );
  }

  refreshStats() {
    this.dataService.getFamilies().subscribe(families => {
      this.dataService.getResidents().subscribe(residents => {
        this.calculateStats(families, residents);
      });
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  private calculateStats(families: Family[], residents: Resident[]) {
    // Region Stats (RT/RW)
    const regions = new Map<string, number>();
    families.forEach(f => {
      const key = f.rt_rw || 'Tak Terdefinisi';
      regions.set(key, (regions.get(key) || 0) + 1);
    });

    const maxFamilies = Math.max(...Array.from(regions.values()), 1);
    const sortedRegions = Array.from(regions.entries())
      .map(([name, count]) => ({
        name,
        familyCount: count,
        familyPercent: (count / maxFamilies) * 100
      }))
      .sort((a, b) => b.familyCount - a.familyCount);

    this.regionStats.set(sortedRegions);
    this.totalRegions.set(regions.size);
    this.densestRegion.set(sortedRegions[0]?.name || '-');

    // District Stats
    const districts = new Map<string, number>();
    residents.forEach(r => {
      // Find matching family for district
      const fam = families.find(f => f.kk_number === r.family_id);
      const key = fam?.district || 'Lainnya';
      districts.set(key, (districts.get(key) || 0) + 1);
    });

    const maxResidents = Math.max(...Array.from(districts.values()), 1);
    this.districtStats.set(Array.from(districts.entries())
      .map(([name, count]) => ({
        name,
        residentCount: count,
        residentPercent: (count / maxResidents) * 100
      }))
      .sort((a, b) => b.residentCount - a.residentCount)
    );

    // General Stats
    if (families.length > 0) {
      this.avgMembersPerFamily.set((residents.length / families.length).toFixed(1));
    }

    // Advanced Stats: Age
    const now = new Date();
    const ageGroups = [
      { label: 'Bayi/Balita (0-5)', min: 0, max: 5, count: 0, color: '#3b82f6' },
      { label: 'Anak-anak (6-17)', min: 6, max: 17, count: 0, color: '#10b981' },
      { label: 'Produktif (18-55)', min: 18, max: 55, count: 0, color: '#818cf8' },
      { label: 'Lansia (56+)', min: 56, max: 200, count: 0, color: '#f59e0b' }
    ];

    residents.forEach(r => {
      const birthDate = new Date(r.birth_date);
      const age = now.getFullYear() - birthDate.getFullYear();
      const group = ageGroups.find(g => age >= g.min && age <= g.max);
      if (group) group.count++;
    });

    const maxAge = Math.max(...ageGroups.map(g => g.count), 1);
    this.ageStats.set(ageGroups.map(g => ({ ...g, percent: (g.count / maxAge) * 100 })));

    // Advanced Stats: Education
    const eduMap = new Map<string, number>();
    residents.forEach(r => {
      const key = r.education || 'TIDAK TERDEFINISI';
      eduMap.set(key, (eduMap.get(key) || 0) + 1);
    });

    const maxEdu = Math.max(...Array.from(eduMap.values()), 1);
    this.educationStats.set(Array.from(eduMap.entries())
      .map(([label, count]) => ({ label, count, percent: (count / maxEdu) * 100 }))
      .sort((a, b) => b.count - a.count)
    );
  }
}
