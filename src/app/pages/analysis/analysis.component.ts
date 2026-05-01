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
       th { 
         text-align: left; padding: 1.5rem; 
         color: #000000; font-size: 0.8rem; font-weight: 800; 
         text-transform: uppercase; letter-spacing: 0.1em; 
         border-bottom: 2px solid #f1f5f9; background: #f8fafc; 
       }
       td { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #000000; }
       .nik-cell { font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 700; font-size: 0.85rem; }
    }
    .badge {
       padding: 0.4rem 0.85rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
       &.sangat-miskin { background: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
       &.miskin { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
       &.sedang { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    }
    .score-pill {
       display: inline-flex; align-items: center; justify-content: center;
       min-width: 44px; height: 28px; border-radius: 2rem;
       font-weight: 800; color: white; font-size: 0.8rem;
       box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }
    .status-chip {
       font-size: 0.85rem; font-weight: 800; color: #94a3b8;
       &.eligible { color: #059669; }
    }
    .custom-select, .custom-input {
       background: #f1f5f9; border: 2px solid transparent;
       color: #000000; padding: 0.85rem 1.25rem; border-radius: 1rem; outline: none;
       font-weight: 700; font-size: 0.9rem; transition: all 0.2s;
       &:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
    .pagination-bar {
       background: #ffffff; border-top: 1px solid #f1f5f9;
       .pagination-info { font-size: 0.85rem; color: #64748b; font-weight: 500; b { color: #000000; } }
    }
    .btn-page {
       background: #f1f5f9; border: none; padding: 0.75rem 1.25rem;
       border-radius: 1rem; font-size: 0.85rem; font-weight: 800; cursor: pointer; color: #1e293b;
       transition: all 0.2s;
       &:hover:not(:disabled) { background: #000000; color: white; transform: translateY(-1px); }
       &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .btn-page-num {
       width: 40px; height: 40px; border-radius: 1rem; border: none;
       background: transparent; color: #64748b; font-size: 0.9rem; font-weight: 800;
       cursor: pointer; transition: 0.2s;
       &:hover { background: #f1f5f9; color: #000000; }
       &.active { background: #2563eb; color: white; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); }
    }
    .empty-state { text-align: center; padding: 6rem; color: #94a3b8; font-weight: 600; }
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
