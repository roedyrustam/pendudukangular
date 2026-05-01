import { Component, inject, signal, OnInit, computed } from '@angular/core';
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
      <header class="header-actions mb-10 flex-between items-end">
        <div class="titles">
          <h2 class="title-gradient">Portal Berita & Informasi Desa</h2>
          <p class="text-muted">Kelola pengumuman, berita terkini, dan dokumentasi kegiatan desa untuk masyarakat.</p>
        </div>
        <button class="btn-primary px-8" (click)="isAddModalOpen.set(true)" aria-label="Buat Artikel Baru">
          Buat Artikel Baru ✍️
        </button>
      </header>

      <!-- Featured Headline -->
      <section class="headline-section mb-12" *ngIf="headlineArticle()">
        <article class="card-luxury p-0 overflow-hidden featured-article-card">
          <div class="featured-media">
            <img [src]="headlineArticle()?.image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'" alt="Headline">
            <div class="media-overlay"></div>
            <div class="media-badge">BERITA UTAMA</div>
          </div>
          <div class="featured-content p-10">
            <div class="meta mb-4">
               <span class="date">{{ headlineArticle()?.created_at | date:'longDate' }}</span>
               <span class="dot">•</span>
               <span class="author">Admin Desa</span>
            </div>
            <h3 class="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">{{ headlineArticle()?.title }}</h3>
            <p class="text-slate-600 font-medium text-lg mb-8 line-clamp-3 leading-relaxed">{{ headlineArticle()?.content }}</p>
            <div class="flex gap-3">
              <button class="btn-primary" (click)="readArticle(headlineArticle()!)">Baca Selengkapnya ➡️</button>
              <button class="btn-outline" (click)="editArticle(headlineArticle()!)">Edit Konten ✏️</button>
            </div>
          </div>
        </article>
      </section>

      <!-- News Feed Grid -->
      <main class="news-feed">
        <h3 class="section-title mb-8">Kabar Desa Terbaru</h3>
        <div class="news-grid">
          <article *ngFor="let art of otherArticles()" class="card-luxury p-0 overflow-hidden news-card">
            <figure class="news-thumb" (click)="readArticle(art)">
              <img [src]="art.image_url || 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2048&auto=format&fit=crop'" alt="News Thumbnail">
              <div class="status-indicator" [class.draft]="!art.is_enabled">
                 {{ art.is_enabled ? 'PUBLISHED' : 'DRAFT' }}
              </div>
            </figure>
            <div class="news-info p-6">
              <div class="flex-between mb-4">
                <span class="text-[10px] font-extrabold text-primary tracking-widest uppercase">{{ art.created_at | date:'dd MMM yyyy' }}</span>
                <span class="text-[10px] font-extrabold text-slate-400">👁️ {{ art.hit_count }}</span>
              </div>
              <h4 class="text-slate-900 font-extrabold text-lg mb-4 line-clamp-2 leading-snug">{{ art.title }}</h4>
              <footer class="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button class="btn-text-sm font-bold text-primary" (click)="readArticle(art)">Baca Berita</button>
                <div class="ml-auto flex gap-1">
                  <button class="btn-icon-sm" (click)="editArticle(art)" title="Edit">✏️</button>
                  <button class="btn-icon-sm delete" (click)="deleteArticle(art.id!)" title="Hapus">🗑️</button>
                </div>
              </footer>
            </div>
          </article>
        </div>
      </main>

      <!-- Reading Experience Modal -->
      <div *ngIf="isReadModalOpen()" class="form-overlay fade-in" (click)="isReadModalOpen.set(false)">
        <article class="read-modal card-luxury glass-panel p-0" (click)="$event.stopPropagation()">
          <button class="close-floating" (click)="isReadModalOpen.set(false)" aria-label="Tutup Berita">✕</button>
          
          <header class="read-hero">
            <img [src]="readingArticle()?.image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop'" alt="Article Banner">
            <div class="hero-overlay"></div>
            <div class="hero-title-area p-10">
              <div class="meta text-white/80 font-bold mb-4">
                 <span>Diterbitkan pada {{ readingArticle()?.created_at | date:'longDate' }}</span>
              </div>
              <h1 class="text-4xl text-white font-black leading-tight">{{ readingArticle()?.title }}</h1>
            </div>
          </header>
          
          <section class="read-body p-12 max-w-4xl mx-auto">
             <div class="article-rich-text text-slate-800 leading-relaxed text-lg">
                {{ readingArticle()?.content }}
             </div>
          </section>
          
          <footer class="read-footer p-10 border-t border-slate-100 flex justify-center">
             <button class="btn-outline px-10" (click)="isReadModalOpen.set(false)">Tutup Artikel</button>
          </footer>
        </article>
      </div>

      <!-- Article Editor Modal -->
      <div *ngIf="isAddModalOpen()" class="form-overlay fade-in" (click)="closeModal()">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <header class="modal-header mb-10">
            <h2 class="title-gradient text-3xl">{{ isEditing() ? 'Edit' : 'Buat' }} Artikel Berita</h2>
            <p class="text-muted">Publikasikan informasi terbaru untuk warga desa secara akurat.</p>
          </header>
          
          <form (submit)="saveArticle()" class="editor-form">
            <div class="input-group mb-6">
              <label>Judul Artikel (Headline)</label>
              <input [(ngModel)]="articleForm.title" name="title" placeholder="Masukkan judul yang menarik..." required class="custom-input text-lg font-bold">
            </div>
            
            <div class="input-group mb-6">
              <label>Isi Berita / Artikel</label>
              <textarea [(ngModel)]="articleForm.content" name="content" rows="12" placeholder="Tuliskan berita lengkap di sini..." required class="custom-textarea"></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-6 mb-10">
              <div class="input-group">
                <label>URL Gambar Utama (Thumbnail)</label>
                <input [(ngModel)]="articleForm.image_url" name="image_url" placeholder="https://..." class="custom-input">
              </div>
              <div class="input-group">
                <label>Pengaturan Publikasi</label>
                <div class="flex gap-6 mt-4">
                  <label class="toggle-control">
                    <input type="checkbox" [(ngModel)]="articleForm.is_enabled" name="enabled">
                    <span class="toggle-label font-bold text-slate-700">Aktif / Publik</span>
                  </label>
                  <label class="toggle-control">
                    <input type="checkbox" [(ngModel)]="articleForm.is_headline" name="headline">
                    <span class="toggle-label font-bold text-slate-700">Set Utama (Headline)</span>
                  </label>
                </div>
              </div>
            </div>

            <footer class="form-actions flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" class="btn-outline px-8" (click)="closeModal()">Batal</button>
              <button type="submit" class="btn-primary px-8" [disabled]="loading()">
                {{ loading() ? 'Sedang Memproses...' : 'Simpan & Terbitkan Artikel' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .articles-container { padding-bottom: 5rem; }
    .section-title { font-size: 0.85rem; font-weight: 800; text-transform: uppercase; color: var(--primary); letter-spacing: 0.15em; border-bottom: 2px solid var(--primary); display: inline-block; padding-bottom: 0.5rem; }
    
    .featured-article-card {
       display: grid; grid-template-columns: 1.2fr 1fr; min-height: 450px;
       .featured-media {
          position: relative; overflow: hidden;
          img { width: 100%; height: 100%; object-fit: cover; }
          .media-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(0,0,0,0) 50%, rgba(255,255,255,1) 100%); }
          .media-badge { position: absolute; top: 2rem; left: 2rem; background: var(--primary); color: white; padding: 0.5rem 1.25rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 900; letter-spacing: 0.1em; }
       }
       .featured-content {
          display: flex; flex-direction: column; justify-content: center; background: white;
          .meta { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); .dot { margin: 0 0.5rem; color: var(--primary); } }
       }
    }

    .news-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2.5rem; }
    
    .news-card {
       transition: 0.4s var(--apple-ease); border: 1px solid var(--glass-border); display: flex; flex-direction: column;
       &:hover { transform: translateY(-12px); border-color: var(--primary); box-shadow: 0 30px 60px -12px rgba(0,0,0,0.1); }
       .news-thumb {
          height: 200px; position: relative; overflow: hidden; cursor: pointer;
          img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
          .status-indicator { position: absolute; bottom: 1rem; right: 1rem; background: rgba(16, 185, 129, 0.9); color: white; padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.6rem; font-weight: 900; backdrop-filter: blur(4px); &.draft { background: rgba(100, 116, 139, 0.9); } }
       }
       &:hover .news-thumb img { transform: scale(1.15); }
    }

    .read-modal {
       width: 95%; max-width: 1000px; height: 90vh; overflow-y: auto; position: relative;
       .close-floating { position: fixed; top: 2rem; right: 3rem; z-index: 100; background: #000; color: #fff; border: none; width: 44px; height: 44px; border-radius: 50%; font-size: 1.25rem; cursor: pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: 0.3s; &:hover { transform: rotate(90deg); background: var(--primary); } }
       .read-hero {
          height: 400px; position: relative;
          img { width: 100%; height: 100%; object-fit: cover; }
          .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); }
          .hero-title-area { position: absolute; bottom: 0; left: 0; right: 0; }
       }
       .article-rich-text { white-space: pre-wrap; font-family: 'Inter', system-ui, sans-serif; text-align: justify; }
    }

    .custom-input, .custom-textarea, .custom-select {
       background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem 1.25rem; border-radius: 1rem;
       outline: none; font-weight: 600; font-size: 0.95rem; width: 100%; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
    
    .toggle-control { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; input { width: 20px; height: 20px; accent-color: var(--primary); } }
    
    @media (max-width: 1024px) {
       .featured-article-card { grid-template-columns: 1fr; .featured-media { height: 300px; .media-overlay { display: none; } } }
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
      const headline = data.find(a => a.is_headline) || data[0] || null;
      this.headlineArticle.set(headline);
      this.otherArticles.set(data.filter(a => a.id !== headline?.id));
    });
  }

  resetForm(): Partial<Article> {
    return {
      is_enabled: true,
      is_headline: false,
      content: ''
    };
  }

  readArticle(article: Article) {
    this.readingArticle.set(article);
    this.isReadModalOpen.set(true);
    // Increment hit count locally and via service
    this.dataService.incrementArticleHit(article.id!).then(() => {
       // Optional: update local count if needed
    });
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
        await this.dataService.addArticle({ ...this.articleForm, slug } as Article);
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
    if (confirm('Hapus artikel ini secara permanen?')) {
      try {
        await this.dataService.deleteArticle(id);
        this.refreshData();
      } catch (err: any) {
        alert('Gagal menghapus artikel: ' + err.message);
      }
    }
  }
}
