import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { Resident, Family, ServiceRequest, ResidentDocument } from '../../models/data.models';
import { Observable, switchMap, of, tap, BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-resident-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="page-container fade-in" *ngIf="resident$ | async as resident; else loading">
      <!-- Breadcrumb / Header -->
      <header class="detail-header mb-8">
        <div class="flex items-center gap-4 mb-2">
          <a routerLink="/residents" class="btn-icon">⬅️</a>
          <span class="text-muted">Data Penduduk / Detail Profil</span>
        </div>
        <div class="flex justify-between items-end">
          <div>
            <h1 class="title-gradient text-4xl mb-2">{{ resident.full_name }}</h1>
            <div class="flex gap-4">
              <span class="badge badge-primary">NIK: {{ resident.nik }}</span>
              <span class="badge" [ngClass]="resident.gender === 'Laki-laki' ? 'badge-blue' : 'badge-pink'">
                {{ resident.gender }}
              </span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-primary" (click)="downloadBiodata(resident)">Cetak Biodata 📄</button>
          </div>
        </div>
      </header>

      <div class="detail-grid">
        <!-- Left Column: Personal Info -->
        <div class="card-luxury glass-panel p-8">
          <h3 class="flex items-center gap-2 mb-6">
            <span>👤</span> Data Pribadi
          </h3>
          
          <div class="info-list">
            <div class="info-item">
              <label>Tempat, Tanggal Lahir</label>
              <p>{{ resident.birth_place }}, {{ resident.birth_date }}</p>
            </div>
            <div class="info-item">
              <label>Pekerjaan</label>
              <p>{{ resident.occupation }}</p>
            </div>
            <div class="info-item">
              <label>Hubungan Keluarga</label>
              <p>{{ resident.relationship }}</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Family Context -->
        <div class="card-luxury glass-panel p-8" *ngIf="family$ | async as family">
          <h3 class="flex items-center gap-2 mb-6">
            <span>🏘️</span> Informasi Keluarga
          </h3>
          
          <div class="info-list">
            <div class="info-item">
              <label>Nomor Kartu Keluarga (KK)</label>
              <a [routerLink]="['/families']" class="kk-link">
                {{ family.kk_number }} 🔗
              </a>
            </div>
            <div class="info-item">
              <label>Kepala Keluarga</label>
              <p>{{ family.head_of_family_name }}</p>
            </div>
            <div class="info-item">
              <label>Alamat Lengkap</label>
              <p>{{ family.address }}</p>
              <p class="text-xs text-muted">RT/RW {{ family.rt_rw }}, {{ family.district }}, {{ family.regency }}</p>
            </div>
          </div>
        </div>

        <!-- Documents Section (Full Width) -->
        <div class="card-luxury glass-panel p-8">
          <h3 class="flex items-center gap-2 mb-6">
            <span>📂</span> Berkas Digital & Dokumen
          </h3>

          <div class="doc-grid">
            <!-- Upload Area -->
            <div class="upload-zone">
              <input type="file" #fileInput (change)="onFileSelected($event, resident.nik)" hidden>
              <button class="upload-box" [disabled]="isUploading()" (click)="fileInput.click()">
                <ng-container *ngIf="!isUploading(); else uploading">
                  <span class="icon">📤</span>
                  <p>Klik atau Seret Berkas ke Sini</p>
                  <span class="hint">Mendukung Gambar/PDF (Maks. 5MB)</span>
                </ng-container>
                <ng-template #uploading>
                  <div class="spinner-small"></div>
                  <p>Mengunggah Berkas...</p>
                </ng-template>
              </button>
            </div>

            <!-- Documents List -->
            <div class="doc-list">
              <div *ngIf="documents$ | async as docs; else loadingDocs">
                <div *ngFor="let doc of docs" class="doc-item">
                  <div class="doc-info">
                    <span class="doc-ext">{{ doc.name.split('.').pop()?.toUpperCase() }}</span>
                    <div class="doc-meta">
                      <strong>{{ doc.name }}</strong>
                      <p>{{ doc.created_at?.toDate() | date:'dd MMM yyyy' }}</p>
                    </div>
                  </div>
                  <div class="doc-actions">
                    <a [href]="doc.url" target="_blank" class="btn-icon">👁️</a>
                    <button (click)="deleteDocument(doc.id!, doc.path)" class="btn-icon text-red">🗑️</button>
                  </div>
                </div>
                <div *ngIf="docs.length === 0" class="empty-docs">
                  Belum ada berkas yang diunggah.
                </div>
              </div>
              <ng-template #loadingDocs>
                <div class="p-4 text-center">Memuat berkas...</div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- History Section (Full Width) -->
        <div class="card-luxury glass-panel p-8 timeline-card">
          <h3 class="flex items-center gap-2 mb-6">
            <span>📜</span> Riwayat Layanan Administrasi
          </h3>
          
          <div class="timeline" *ngIf="requests$ | async as requests; else noRequests">
            <div *ngFor="let req of requests" class="timeline-item">
              <div class="tl-marker"></div>
              <div class="tl-content">
                <div class="flex justify-between">
                  <strong>{{ req.service_type }}</strong>
                  <span class="badge-status" [attr.data-status]="req.status">{{ req.status }}</span>
                </div>
                <p class="text-sm text-muted mb-1">{{ req.reason }}</p>
                <p class="text-xs">{{ req.created_at?.toDate() | date:'dd MMM yyyy, HH:mm' }}</p>
              </div>
            </div>
            <div *ngIf="requests.length === 0" class="empty-state p-8 text-center">
              <p class="text-muted">Belum ada riwayat pengajuan layanan untuk penduduk ini.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #loading>
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Memuat profil penduduk...</p>
      </div>
    </ng-template>

    <ng-template #noRequests>
       <p class="text-muted p-8">Memuat riwayat...</p>
    </ng-template>
  `,
  styles: [`
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .timeline-card { grid-column: span 2; }
    
    .info-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      .info-item {
        label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
        p, a { font-size: 1.1rem; color: #fff; font-weight: 500; }
      }
    }

    .kk-link {
      color: var(--primary) !important;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    .badge-status {
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
      border-radius: 1rem;
      background: rgba(255,255,255,0.05);
      &[data-status='Selesai'] { color: #10b981; background: rgba(16, 185, 129, 0.1); }
      &[data-status='Diproses'] { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
      &[data-status='Pending'] { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
      &[data-status='Ditolak'] { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    }

    /* Document Section */
    .doc-grid {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 2rem;
    }
    .upload-box {
      width: 100%;
      height: 180px;
      border: 2px dashed rgba(255,255,255,0.1);
      border-radius: 1rem;
      background: rgba(255,255,255,0.02);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.05); }
      .icon { font-size: 2rem; margin-bottom: 0.5rem; }
      p { font-weight: 600; font-size: 0.9rem; }
      .hint { font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; }
    }
    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(255,255,255,0.03);
      border-radius: 0.75rem;
      border: 1px solid rgba(255,255,255,0.05);
      .doc-info {
        display: flex;
        align-items: center;
        gap: 1rem;
        .doc-ext {
          width: 40px;
          height: 40px;
          background: var(--primary);
          color: #000;
          font-weight: 800;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
        }
        .doc-meta {
          strong { display: block; font-size: 0.9rem; }
          p { font-size: 0.75rem; color: var(--text-muted); }
        }
      }
      .doc-actions {
        display: flex;
        gap: 0.5rem;
      }
    }
    .empty-docs { text-align: center; color: var(--text-muted); padding: 2rem; border: 1px solid rgba(255,255,255,0.05); border-radius: 0.75rem; font-size: 0.9rem; }

    /* Timeline Styling */
    .timeline {
      position: relative;
      padding-left: 2rem;
      &::before {
        content: '';
        position: absolute;
        left: 0.45rem;
        top: 0;
        bottom: 0;
        width: 1px;
        background: var(--border-color);
      }
      .timeline-item {
        position: relative;
        padding-bottom: 2rem;
        .tl-marker {
          position: absolute;
          left: -1.85rem;
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
          top: 0.25rem;
        }
        .tl-content {
          padding-left: 1rem;
        }
      }
    }

    .loading-state {
      height: 400px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    @media (max-width: 1024px) {
      .detail-grid { grid-template-columns: 1fr; }
      .timeline-card { grid-column: span 1; }
    }
  `]
})
export class ResidentDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);
  private pdfService = inject(PdfService);

  resident$!: Observable<Resident | undefined>;
  family$!: Observable<Family | undefined>;
  requests$!: Observable<ServiceRequest[]>;
  documents$!: Observable<ResidentDocument[]>;
  isUploading = signal(false);

  ngOnInit() {
    this.resident$ = this.route.paramMap.pipe(
      switchMap(params => {
        const nik = params.get('nik');
        if (nik) {
          return this.dataService.getResident(nik);
        }
        return of(undefined);
      }),
      tap(resident => {
        if (resident) {
          this.fetchFamily(resident.family_id);
          this.fetchRequests(resident.nik);
          this.fetchDocuments(resident.nik);
        }
      })
    );
  }

  fetchFamily(family_id: string) {
    this.family$ = this.dataService.getFamily(family_id);
  }

  fetchRequests(nik: string) {
    this.requests$ = this.dataService.getResidentRequests(nik);
  }

  fetchDocuments(nik: string) {
    this.documents$ = this.dataService.getResidentDocuments(nik);
  }

  async onFileSelected(event: any, nik: string) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.isUploading.set(true);
      const type = file.type.includes('pdf') ? 'PDF' : 'Image';
      await this.dataService.uploadResidentDocument(nik, file, type);
    } catch (error) {
      console.error('Upload failed', error);
      alert('Gagal mengunggah berkas.');
    } finally {
      this.isUploading.set(false);
    }
  }

  async deleteDocument(id: string, path: string) {
    if (!confirm('Hapus berkas ini permanen?')) return;
    try {
      await this.dataService.deleteResidentDocument(id, path);
    } catch (error) {
      console.error('Delete failed', error);
      alert('Gagal menghapus berkas.');
    }
  }

  async downloadBiodata(resident: Resident) {
    const family = await (this.family$ ? new Promise<Family | undefined>(resolve => this.family$.subscribe((f: Family | undefined) => resolve(f))) : Promise.resolve(undefined));
    this.pdfService.generateResidentBiodata(resident, family as Family);
  }
}
