import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Family, Resident } from '../../models/data.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions mb-6">
      <div class="titles">
        <h2 class="title-gradient">Analisis Kelayakan Bantuan (Bansos)</h2>
        <p class="text-muted">Rekomendasi penerima bantuan berdasarkan klasifikasi sosial dan ekonomi.</p>
      </div>
      <div class="flex gap-2">
         <button class="btn-outline" (click)="exportAnalysis()">📥 Export PDF</button>
      </div>
    </div>

    <div class="filter-bar card-luxury mb-6 p-4">
       <div class="flex gap-4 items-center">
          <div class="input-group">
             <label class="text-xs text-muted">Kategori Bantuan</label>
             <select [(ngModel)]="selectedCategory" class="custom-select">
                <option value="PKH">PKH (Program Keluarga Harapan)</option>
                <option value="BLT">BLT (Bantuan Langsung Tunai)</option>
                <option value="BPNT">BPNT (Bantuan Pangan Non Tunai)</option>
             </select>
          </div>
          <div class="input-group">
             <label class="text-xs text-muted">Batas Skor Layak</label>
             <input type="number" [(ngModel)]="scoreThreshold" class="custom-input" style="width: 80px;">
          </div>
       </div>
    </div>

    <div class="analysis-grid">
       <div class="card-luxury p-0 overflow-hidden">
          <table class="luxury-table">
             <thead>
                <tr>
                   <th>Nama Kepala Keluarga</th>
                   <th>NIK</th>
                   <th>Kelas Sosial</th>
                   <th>Tanggungan</th>
                   <th>Skor Kelayakan</th>
                   <th>Rekomendasi</th>
                </tr>
             </thead>
             <tbody>
                <tr *ngFor="let item of analyzedData()">
                   <td>{{ item.headName }}</td>
                   <td class="nik-cell">{{ item.nik }}</td>
                   <td><span class="badge" [class]="item.socialClass.toLowerCase().replace(' ', '-')">{{ item.socialClass }}</span></td>
                   <td>{{ item.dependents }} Orang</td>
                   <td>
                      <div class="score-pill" [style.background]="getScoreColor(item.score)">
                         {{ item.score }}
                      </div>
                   </td>
                   <td>
                      <span class="status-chip" [class.eligible]="item.score >= scoreThreshold()">
                         {{ item.score >= scoreThreshold() ? '✅ Layak' : '❌ Tidak Layak' }}
                      </span>
                   </td>
                </tr>
             </tbody>
          </table>
          <div *ngIf="analyzedData().length === 0" class="empty-state">
             Data tidak tersedia atau belum dianalisis.
          </div>
       </div>
    </div>
  `,
  styles: [`
    .luxury-table {
       width: 100%;
       border-collapse: collapse;
       th { text-align: left; padding: 1rem 1.5rem; color: var(--text-muted); font-size: 0.8rem; border-bottom: 1px solid var(--border-color); }
       td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; }
       .nik-cell { font-family: monospace; color: var(--primary); }
    }
    .badge {
       padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem;
       &.sangat-miskin { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
       &.miskin { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
       &.sedang { background: rgba(99, 102, 241, 0.1); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.2); }
    }
    .score-pill {
       display: inline-block;
       padding: 0.2rem 0.8rem;
       border-radius: 2rem;
       font-weight: 800;
       color: white;
       font-size: 0.8rem;
    }
    .status-chip {
       font-size: 0.75rem;
       font-weight: 600;
       opacity: 0.6;
       &.eligible { opacity: 1; color: #10b981; }
    }
    .custom-select, .custom-input {
       background: rgba(255,255,255,0.05);
       border: 1px solid var(--border-color);
       color: white;
       padding: 0.5rem;
       border-radius: 0.4rem;
       outline: none;
       &:focus { border-color: var(--primary); }
    }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .flex { display: flex; }
    .gap-2 { gap: 0.5rem; }
    .gap-4 { gap: 1rem; }
    .items-center { align-items: center; }
  `]
})
export class ResidentAnalysisComponent {
  private dataService = inject(DataService);
  
  selectedCategory = signal('PKH');
  scoreThreshold = signal(70);
  
  families = signal<Family[]>([]);
  residents = signal<Resident[]>([]);
  
  analyzedData = computed(() => {
    const fams = this.families();
    const res = this.residents();
    
    return fams.map(f => {
      const members = res.filter(r => r.family_id === f.kk_number);
      const score = this.calculateScore(f, members);
      
      return {
        headName: f.head_of_family_name,
        nik: f.head_of_family_nik,
        socialClass: f.social_class || 'Sedang',
        dependents: members.length,
        score: score
      };
    }).sort((a, b) => b.score - a.score);
  });

  constructor() {
    this.dataService.getFamilies().subscribe(d => this.families.set(d));
    this.dataService.getResidents().subscribe(d => this.residents.set(d));
  }

  private calculateScore(family: Family, members: Resident[]): number {
    let score = 0;
    
    // 1. Social Class (Max 50)
    if (family.social_class === 'Sangat Miskin') score += 50;
    else if (family.social_class === 'Miskin') score += 35;
    else if (family.social_class === 'Sedang') score += 15;
    
    // 2. Dependents (Max 30)
    const count = members.length;
    if (count >= 5) score += 30;
    else if (count >= 3) score += 20;
    else score += 10;
    
    // 3. Occupation Bonus (Max 20)
    const occupations = members.map(m => m.occupation?.toLowerCase());
    const hasUnemployed = occupations.some(o => o?.includes('tidak') || o?.includes('buruh') || o?.includes('tani'));
    if (hasUnemployed) score += 20;

    return Math.min(score, 100);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#ef4444'; // High Priority
    if (score >= 60) return '#f59e0b'; // Medium
    return '#3b82f6'; // Low
  }

  exportAnalysis() {
    alert('Fungsi export PDF sedang disiapkan.');
  }
}
