import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Article } from '../../models/data.models';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="articles-container fade-in">
      <header class="mb-8 flex justify-between items-end">
        <div>
          <h2 class="title-gradient">Portal Berita & Informasi Desa</h2>
          <p class="text-muted">Kelola pengumuman, berita terkini, dan dokumentasi kegiatan desa.</p>
        </div>
        <button class="btn-primary" (click)="isAddModalOpen.set(true)">
          Buat Artikel Baru ✍️
        </button>
      </header>

      <!-- Featured Headline -->
      <div class="headline-section mb-10" *ngIf="headlineArticle()">
        <div class="card-luxury glass-panel featured-card">
          <div class="featured-image">
            <img [src]="headlineArticle()?.image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'" alt="Headline">
            <div class="featured-badge">HEADLINE</div>
          </div>
          <div class="featured-content">
            <span class="text-xs text-primary mb-2 block">{{ headlineArticle()?.created_at | date:'medium' }}</span>
            <h3 class="mb-4">{{ headlineArticle()?.title }}</h3>
            <p class="text-muted mb-6">{{ headlineArticle()?.content | slice:0:200 }}...</p>
            <div class="flex gap-2">
              <button class="btn-primary" (click)="readArticle(headlineArticle()!)">Baca Selengkapnya</button>
              <button class="btn-outline-sm" (click)="editArticle(headlineArticle()!)">Edit Artikel</button>
            </div>
          </div>
        </div>
      </div>

      <!-- News Feed -->
      <div class="news-grid">
        <div *ngFor="let art of otherArticles()" class="card-luxury glass-panel news-card">
          <div class="news-image" (click)="readArticle(art)">
            <img [src]="art.image_url || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2048&auto=format&fit=crop'" alt="News">
          </div>
          <div class="news-content p-5">
            <div class="flex justify-between items-start mb-2" (click)="readArticle(art)">
              <span class="text-xs text-muted">{{ art.created_at | date:'dd MMM yyyy' }}</span>
              <span class="badge" [class.active]="art.is_enabled">{{ art.is_enabled ? 'Aktif' : 'Draft' }}</span>
            </div>
            <h4 class="mb-4">{{ art.title }}</h4>
            <div class="flex justify-between items-center mt-auto">
              <span class="text-xs text-muted">👁️ {{ art.hit_count }} kali dilihat</span>
              <div class="flex gap-1">
                <button class="btn-icon-sm" (click)="editArticle(art)">✏️</button>
                <button class="btn-icon-sm text-red" (click)="deleteArticle(art.id!)">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Read Modal -->
      <div *ngIf="isReadModalOpen()" class="form-overlay" (click)="isReadModalOpen.set(false)">
        <div class="read-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="isReadModalOpen.set(false)">✕</button>
          <div class="read-header">
            <img [src]="readingArticle()?.image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'" alt="Banner">
            <div class="overlay"></div>
            <div class="title-box">
              <span class="badge active mb-2">{{ readingArticle()?.created_at | date:'longDate' }}</span>
              <h1>{{ readingArticle()?.title }}</h1>
            </div>
          </div>
          <div class="read-content p-10">
            <div class="article-body">
               {{ readingArticle()?.content }}
            </div>
          </div>
        </div>
      </div>
      <div *ngIf="isAddModalOpen()" class="form-overlay" (click)="closeModal()">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header mb-6">
            <h3 class="title-gradient">{{ isEditing() ? 'Edit' : 'Buat' }} Artikel</h3>
            <p class="text-muted">Publikasikan informasi terbaru untuk warga.</p>
          </div>
          
          <form (submit)="saveArticle()">
            <div class="input-group mb-4">
              <label>Judul Artikel</label>
              <input [(ngModel)]="articleForm.title" name="title" placeholder="Contoh: Penyaluran BLT Tahap II" required>
            </div>
            <div class="input-group mb-4">
              <label>Konten / Isi Artikel</label>
              <textarea [(ngModel)]="articleForm.content" name="content" rows="10" placeholder="Tuliskan detail berita di sini..." required></textarea>
            </div>
            <div class="grid-2 mb-6">
              <div class="input-group">
                <label>URL Gambar Utama</label>
                <input [(ngModel)]="articleForm.image_url" name="image_url" placeholder="https://...">
              </div>
              <div class="input-group">
                <label>Opsi Publikasi</label>
                <div class="flex gap-4 mt-2">
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="articleForm.is_enabled" name="enabled"> Aktif
                  </label>
                  <label class="checkbox-label">
                    <input type="checkbox" [(ngModel)]="articleForm.is_headline" name="headline"> Headline
                  </label>
                </div>
              </div>
            </div>
            <div class="form-actions mt-8">
              <button type="button" class="btn-text" (click)="closeModal()">Batal</button>
              <button type="submit" class="btn-primary" [disabled]="loading()">
                {{ loading() ? 'Menyimpan...' : 'Simpan & Publikasikan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .articles-container {
      padding-bottom: 4rem;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .featured-card {
      display: flex;
      padding: 0;
      overflow: hidden;
      height: 400px;
      .featured-image {
        width: 50%;
        position: relative;
        img { width: 100%; height: 100%; object-fit: cover; }
        .featured-badge {
          position: absolute;
          top: 1.5rem;
          left: 1.5rem;
          background: var(--primary);
          padding: 0.4rem 1rem;
          border-radius: 2rem;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 1px;
        }
      }
      .featured-content {
        width: 50%;
        padding: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        h3 { font-size: 2rem; line-height: 1.2; }
      }
    }
    .news-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }
    .news-card {
      padding: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      .news-image {
        height: 180px;
        img { width: 100%; height: 100%; object-fit: cover; }
      }
      h4 { font-size: 1.1rem; line-height: 1.4; color: #fff; }
    }
    .badge {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
      border-radius: 0.5rem;
      background: rgba(255,255,255,0.1);
      &.active { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    }
    .btn-icon-sm {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      padding: 0.4rem;
      border-radius: 0.5rem;
      cursor: pointer;
      &:hover { border-color: var(--primary); }
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      cursor: pointer;
    }
    textarea {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      border-radius: 0.75rem;
      color: white;
      padding: 1rem;
      font-family: inherit;
      &:focus { border-color: var(--primary); outline: none; }
    }
    .read-card {
      width: 90%;
      max-width: 900px;
      height: 90vh;
      padding: 0;
      overflow-y: auto;
      position: relative;
      .close-btn { position: absolute; top: 1rem; right: 1rem; z-index: 10; background: rgba(0,0,0,0.5); border: none; color: white; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
      .read-header {
        height: 350px;
        position: relative;
        img { width: 100%; height: 100%; object-fit: cover; }
        .overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.9)); }
        .title-box { position: absolute; bottom: 2rem; left: 3rem; right: 3rem; }
        h1 { font-size: 2.5rem; color: white; }
      }
      .article-body {
        font-size: 1.1rem;
        line-height: 1.8;
        color: var(--text-main);
        white-space: pre-wrap;
      }
    }
    @media (max-width: 900px) {
      .featured-card { flex-direction: column; height: auto; 
        .featured-image, .featured-content { width: 100%; }
        .featured-content { padding: 1.5rem; }
      }
    }
  `]
})
export class ArticlesComponent implements OnInit {
  private dataService = inject(DataService);

  articles = signal<Article[]>([]);
  headlineArticle = signal<Article | null>(null);
  otherArticles = signal<Article[]>([]);

  isAddModalOpen = signal(false);
  isReadModalOpen = signal(false);
  readingArticle = signal<Article | null>(null);
  isEditing = signal(false);
  loading = signal(false);

  articleForm: Partial<Article> = this.resetForm();

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.dataService.getArticles().subscribe(data => {
      this.articles.set(data);
      this.headlineArticle.set(data.find(a => a.is_headline) || data[0] || null);
      this.otherArticles.set(data.filter(a => a.id !== this.headlineArticle()?.id));
    });
  }

  resetForm(): Partial<Article> {
    return {
      is_enabled: true,
      is_headline: false
    };
  }

  readArticle(article: Article) {
    this.readingArticle.set(article);
    this.isReadModalOpen.set(true);
  }

  editArticle(article: Article) {
    this.isEditing.set(true);
    this.articleForm = { ...article };
    this.isAddModalOpen.set(true);
  }

  closeModal() {
    this.isAddModalOpen.set(false);
    this.isEditing.set(false);
    this.articleForm = this.resetForm();
  }

  async saveArticle() {
    this.loading.set(true);
    try {
      if (this.isEditing()) {
        await this.dataService.updateArticle(this.articleForm);
      } else {
        const slug = (this.articleForm.title || '').toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        await this.dataService.addArticle({ ...this.articleForm, slug });
      }
      this.refreshData();
      this.closeModal();
    } catch (err: any) {
      alert('Gagal menyimpan artikel: ' + err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteArticle(id: number) {
    if (confirm('Hapus artikel ini permanen?')) {
      try {
        await this.dataService.deleteArticle(id);
        this.refreshData();
      } catch (err: any) {
        alert('Gagal menghapus artikel: ' + err.message);
      }
    }
  }
}
