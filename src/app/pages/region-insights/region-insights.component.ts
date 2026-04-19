import { Component, inject, signal } from '@angular/core';
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
  `,
  styles: [`
    .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .insight-card { 
      height: 400px; display: flex; flex-direction: column; 
      h3 { font-size: 1.1rem; margin-bottom: 1.5rem; }
    }
    .scroll-area { flex: 1; overflow-y: auto; padding-right: 0.5rem; }
    
    .region-row { 
      margin-bottom: 1.25rem;
      .row-header { display: flex; justify-content: space-between; margin-bottom: 0.4rem; font-size: 0.85rem; }
      .region-label { font-weight: 500; }
      .row-count { color: var(--primary); font-weight: 700; }
    }
    
    .progress-container { height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
    .progress-bar { 
      height: 100%; background: linear-gradient(90deg, var(--primary), #818cf8); border-radius: 4px; transition: width 1s ease;
      &.alt { background: linear-gradient(90deg, #ec4899, #f472b6); }
    }
    
    .stats-overview { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .stat-mini-card { 
      padding: 1.5rem;
      label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      p { font-size: 1.75rem; font-weight: 700; color: var(--text-main); margin-top: 0.25rem; }
    }
    
    .mt-8 { margin-top: 2rem; }
  `]
})
export class RegionInsightsComponent {
  private dataService = inject(DataService);
  
  regionStats = signal<any[]>([]);
  districtStats = signal<any[]>([]);
  avgMembersPerFamily = signal('0');
  totalRegions = signal(0);
  densestRegion = signal('-');

  constructor() {
    this.dataService.getFamilies().subscribe(families => {
      this.dataService.getResidents().subscribe(residents => {
        this.calculateStats(families, residents);
      });
    });
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
  }
}
