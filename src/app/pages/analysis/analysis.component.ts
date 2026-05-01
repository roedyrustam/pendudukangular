import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { Family, Resident } from '../../models/data.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="header-actions mb-6 fade-in">
      <div class="titles">
        <h2 class="title-gradient">Analisis Kelayakan Bantuan (Bansos)</h2>
        <p class="text-muted">Rekomendasi penerima bantuan berdasarkan klasifikasi sosial dan ekonomi.</p>
      </div>
      <div class="flex gap-2">
         <button class="btn-outline" (click)="exportAnalysis()" aria-label="Ekspor Analisis Bansos ke PDF">📥 Export PDF</button>
      </div>
    </header>

    <section class="filter-bar card-luxury mb-6 p-6 fade-in" aria-label="Filter Analisis">
       <div class="flex gap-6 items-center flex-wrap">
          <div class="input-group">
             <label class="text-xs font-bold text-primary mb-2 block uppercase letter-spacing-1">Kategori Bantuan</label>
             <select [ngModel]="selectedCategory()" (ngModelChange)="selectedCategory.set($event)" class="custom-select" aria-label="Pilih Kategori Bantuan">
                <option value="PKH">PKH (Program Keluarga Harapan)</option>
                <option value="BLT">BLT (Bantuan Langsung Tunai)</option>
                <option value="BPNT">BPNT (Bantuan Pangan Non Tunai)</option>
             </select>
          </div>
          <div class="input-group">
             <label class="text-xs font-bold text-primary mb-2 block uppercase letter-spacing-1">Batas Skor Layak</label>
             <input type="number" [ngModel]="scoreThreshold()" (ngModelChange)="scoreThreshold.set($event)" class="custom-input" style="width: 100px;" aria-label="Batas Skor Kelayakan">
          </div>
          <div class="input-group ml-auto">
             <label class="text-xs font-bold text-primary mb-2 block uppercase letter-spacing-1">Tampilkan</label>
             <select [ngModel]="pageSize()" (ngModelChange)="pageSize.set($event); currentPage.set(1)" class="custom-select" style="width: 80px;" aria-label="Jumlah data per halaman">
                <option [ngValue]="10">10</option>
                <option [ngValue]="25">25</option>
                <option [ngValue]="50">50</option>
             </select>
          </div>
       </div>
    </section>

    <main class="analysis-grid fade-in">
       <div class="card-luxury p-0 overflow-hidden">
          <table class="luxury-table">
             <thead>
                <tr>
                   <th>Kepala Keluarga</th>
                   <th>NIK</th>
                   <th>Kelas Sosial</th>
                   <th>Tanggungan</th>
                   <th>Skor</th>
                   <th>Rekomendasi</th>
                </tr>
             </thead>
             <tbody>
                <tr *ngFor="let item of paginatedData()">
                   <td>
                      <div class="font-bold text-sm">{{ item.headName }}</div>
                      <div class="text-[10px] text-muted uppercase">{{ item.socialClass }}</div>
                   </td>
                   <td class="nik-cell">{{ item.nik }}</td>
                   <td>
                      <span class="badge" [class]="item.socialClass.toLowerCase().replace(' ', '-')">
                         {{ item.socialClass }}
                      </span>
                   </td>
                   <td><span class="font-bold">{{ item.dependents }}</span> <span class="text-xs text-muted">Jiwa</span></td>
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
          
          <!-- Pagination Controls -->
          <footer class="pagination-bar glass-panel p-4 flex-between">
             <div class="pagination-info">
                Menampilkan <b>{{ startIndex() + 1 }}-{{ endIndex() }}</b> dari <b>{{ totalRecords() }}</b> Keluarga
             </div>
             <nav class="pagination-controls flex gap-2" aria-label="Navigasi Halaman Analisis">
                <button class="btn-page" [disabled]="currentPage() === 1" (click)="currentPage.set(currentPage() - 1)">
                   Sebelumnya
                </button>
                <div class="page-numbers flex gap-1">
                   <button *ngFor="let p of getVisiblePages()" 
                      class="btn-page-num" 
                      [class.active]="p === currentPage()"
                      (click)="currentPage.set(p)"
                      [attr.aria-label]="'Halaman ' + p">
                      {{ p }}
                   </button>
                </div>
                <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="currentPage.set(currentPage() + 1)">
                   Selanjutnya
                </button>
             </nav>
          </footer>

          <div *ngIf="analyzedData().length === 0" class="empty-state">
             <div class="text-4xl mb-4">🔍</div>
             <p>Data tidak tersedia atau belum dianalisis.</p>
          </div>
       </div>
    </main>
  `,
  styles: [`
    .luxury-table {
       width: 100%;
       border-collapse: separate;
       border-spacing: 0;
       th { text-align: left; padding: 1.25rem 1.5rem; color: var(--text-muted); font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid var(--glass-border); background: rgba(0,0,0,0.01); }
       td { padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--glass-border); font-size: 0.9rem; }
       .nik-cell { font-family: 'JetBrains Mono', monospace; color: var(--primary); font-weight: 600; font-size: 0.8rem; }
    }
    .badge {
       padding: 0.35rem 0.75rem; border-radius: 2rem; font-size: 0.65rem; font-weight: 800; text-transform: uppercase;
       &.sangat-miskin { background: rgba(239, 68, 68, 0.1); color: #dc2626; border: 1px solid rgba(239, 68, 68, 0.1); }
       &.miskin { background: rgba(245, 158, 11, 0.1); color: #d97706; border: 1px solid rgba(245, 158, 11, 0.1); }
       &.sedang { background: rgba(99, 102, 241, 0.1); color: #4f46e5; border: 1px solid rgba(99, 102, 241, 0.1); }
    }
    .score-pill {
       display: inline-flex; align-items: center; justify-content: center;
       min-width: 40px; height: 24px; border-radius: 2rem;
       font-weight: 800; color: white; font-size: 0.75rem;
    }
    .status-chip {
       font-size: 0.75rem; font-weight: 700; color: var(--text-muted); opacity: 0.6;
       &.eligible { opacity: 1; color: #059669; }
    }
    .custom-select, .custom-input {
       background: rgba(0,0,0,0.03); border: 1px solid var(--glass-border);
       color: var(--text-main); padding: 0.75rem 1rem; border-radius: 0.75rem; outline: none;
       font-weight: 600; font-size: 0.85rem; transition: all 0.3s var(--apple-ease);
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
    }
    .pagination-bar {
       background: rgba(255,255,255,0.4); border-top: 1px solid var(--glass-border);
       .pagination-info { font-size: 0.8rem; color: var(--text-muted); b { color: var(--text-main); } }
    }
    .btn-page {
       background: white; border: 1px solid var(--glass-border); padding: 0.5rem 1rem;
       border-radius: 0.75rem; font-size: 0.75rem; font-weight: 700; cursor: pointer;
       transition: all 0.2s var(--apple-ease);
       &:hover:not(:disabled) { background: var(--primary); color: white; border-color: var(--primary); transform: translateY(-1px); }
       &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .btn-page-num {
       width: 34px; height: 34px; border-radius: 0.75rem; border: 1px solid transparent;
       background: transparent; color: var(--text-muted); font-size: 0.8rem; font-weight: 700;
       cursor: pointer; transition: 0.2s;
       &:hover { background: rgba(0,0,0,0.05); color: var(--text-main); }
       &.active { background: var(--primary); color: white; }
    }
    .empty-state { text-align: center; padding: 5rem; color: var(--text-muted); font-weight: 500; }
    .ml-auto { margin-left: auto; }
    .letter-spacing-1 { letter-spacing: 0.05em; }
  `]
})
export class ResidentAnalysisComponent {
  private dataService = inject(DataService);
  private pdfService = inject(PdfService);
  
  selectedCategory = signal('PKH');
  scoreThreshold = signal(70);
  
  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(10);
  
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

  // Paginated View
  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.analyzedData().slice(start, start + this.pageSize());
  });

  // Pagination Helpers
  totalRecords = computed(() => this.analyzedData().length);
  totalPages = computed(() => Math.ceil(this.totalRecords() / this.pageSize()));
  startIndex = computed(() => (this.currentPage() - 1) * this.pageSize());
  endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalRecords()));

  constructor() {
    this.dataService.getFamilies().subscribe(d => this.families.set(d));
    this.dataService.getResidents().subscribe(d => this.residents.set(d));
  }

  getVisiblePages(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
      } else if (current >= total - 3) {
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        for (let i = current - 2; i <= current + 2; i++) pages.push(i);
      }
    }
    return pages;
  }

  private calculateScore(family: Family, members: Resident[]): number {
    let score = 0;
    if (family.social_class === 'Sangat Miskin') score += 50;
    else if (family.social_class === 'Miskin') score += 35;
    else if (family.social_class === 'Sedang') score += 15;
    
    const count = members.length;
    if (count >= 5) score += 30;
    else if (count >= 3) score += 20;
    else score += 10;
    
    const occupations = members.map(m => m.occupation?.toLowerCase());
    const hasUnemployed = occupations.some(o => o?.includes('tidak') || o?.includes('buruh') || o?.includes('tani'));
    if (hasUnemployed) score += 20;

    return Math.min(score, 100);
  }

  getScoreColor(score: number): string {
    if (score >= 80) return '#dc2626';
    if (score >= 60) return '#d97706';
    return '#2563eb';
  }

  exportAnalysis() {
    this.pdfService.generateAnalysisReport(this.analyzedData(), this.selectedCategory());
  }
}
