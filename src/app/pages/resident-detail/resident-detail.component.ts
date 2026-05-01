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
          
          <div class="info-grid">
            <div class="info-item">
              <label>Tempat, Tanggal Lahir</label>
              <p>{{ resident.birth_place }}, {{ resident.birth_date }}</p>
            </div>
            <div class="info-item">
              <label>Jenis Kelamin</label>
              <p>{{ resident.gender }}</p>
            </div>
            <div class="info-item">
              <label>Agama</label>
              <p>{{ resident.religion || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Status Perkawinan</label>
              <p>{{ resident.marital_status || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Pendidikan</label>
              <p>{{ resident.education || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Pekerjaan</label>
              <p>{{ resident.occupation }}</p>
            </div>
            <div class="info-item">
              <label>Hubungan Keluarga</label>
              <p>{{ resident.relationship }}</p>
            </div>
            <div class="info-item">
              <label>Golongan Darah</label>
              <p>{{ resident.blood_type || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Kewarganegaraan</label>
              <p>{{ resident.citizenship || 'WNI' }}</p>
            </div>
            <div class="info-item">
              <label>No. Telepon</label>
              <p>{{ resident.phone || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Nama Ayah</label>
              <p>{{ resident.father_name || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Nama Ibu</label>
              <p>{{ resident.mother_name || '-' }}</p>
            </div>
            <div class="info-item full-width">
              <label>Alamat Sekarang</label>
              <p>{{ resident.address || '-' }}</p>
            </div>
          </div>
        </div>

        <!-- Right Column: Family Context -->
        <div class="card-luxury glass-panel p-8" *ngIf="family$ | async as family">
          <h3 class="flex items-center gap-2 mb-6">
            <span>🏘️</span> Informasi Keluarga
          </h3>
          
          <div class="info-grid">
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
            <div class="info-item" *ngIf="family.head_of_family_nik">
              <label>NIK Kepala Keluarga</label>
              <p class="nik-mono">{{ family.head_of_family_nik }}</p>
            </div>
            <div class="info-item full-width">
              <label>Alamat Lengkap</label>
              <p>{{ family.address }}</p>
              <p class="text-xs text-muted">
                RT {{ family.rt || '-' }} / RW {{ family.rw || '-' }}, 
                Dusun {{ family.hamlet || '-' }}, {{ family.district }}, {{ family.regency }}
              </p>
            </div>
            <div class="info-item" *ngIf="family.social_class">
              <label>Kelas Sosial</label>
              <p>{{ family.social_class }}</p>
            </div>
            <div class="info-item" *ngIf="family.print_date">
              <label>Tanggal Cetak KK</label>
              <p>{{ family.print_date }}</p>
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
                      <p>{{ doc.created_at | date:'dd MMM yyyy' }}</p>
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
                <p class="text-xs">{{ req.created_at | date:'dd MMM yyyy, HH:mm' }}</p>
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
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      .info-item {
        label { display: block; font-size: 0.75rem; font-weight: 700; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }
        p, a { font-size: 1.1rem; color: #000000; font-weight: 600; }
        &.full-width { grid-column: 1 / -1; }
      }
    }
    .nik-mono { font-family: 'JetBrains Mono', monospace; color: #2563eb !important; font-weight: 700 !important; }

    .kk-link {
      color: #2563eb !important;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      &:hover { text-decoration: underline; }
    }

    .badge-status {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.35rem 0.85rem;
      border-radius: 2rem;
      background: #f1f5f9;
      &[data-status='Selesai'] { color: #15803d; background: #dcfce7; }
      &[data-status='Diproses'] { color: #1d4ed8; background: #dbeafe; }
      &[data-status='Pending'] { color: #b45309; background: #fef3c7; }
      &[data-status='Ditolak'] { color: #dc2626; background: #fef2f2; }
    }

    /* Document Section */
    .doc-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 3rem;
    }
    .upload-box {
      width: 100%;
      height: 200px;
      border: 2px dashed #e2e8f0;
      border-radius: 1.5rem;
      background: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover { border-color: #2563eb; background: #eff6ff; }
      .icon { font-size: 2.5rem; margin-bottom: 1rem; }
      p { font-weight: 800; font-size: 1rem; color: #000000; }
      .hint { font-size: 0.75rem; color: #64748b; margin-top: 0.5rem; font-weight: 500; }
    }
    .doc-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .doc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      background: white;
      border-radius: 1.25rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
      transition: all 0.2s;
      &:hover { border-color: #cbd5e1; transform: translateX(4px); }
      .doc-info {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        .doc-ext {
          width: 48px;
          height: 48px;
          background: #000000;
          color: white;
          font-weight: 800;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.75rem;
        }
        .doc-meta {
          strong { display: block; font-size: 1rem; color: #000000; }
          p { font-size: 0.8rem; color: #64748b; font-weight: 500; }
        }
      }
    }
    .empty-docs { 
      text-align: center; color: #94a3b8; padding: 3rem; 
      border: 2px dashed #f1f5f9; border-radius: 1.5rem; font-weight: 500;
    }

    /* Timeline Styling */
    .timeline {
      position: relative;
      padding-left: 2.5rem;
      &::before {
        content: '';
        position: absolute;
        left: 0.45rem;
        top: 0;
        bottom: 0;
        width: 3px;
        background: #f1f5f9;
        border-radius: 2px;
      }
      .timeline-item {
        position: relative;
        padding-bottom: 2.5rem;
        .tl-marker {
          position: absolute;
          left: -2.35rem;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #000000;
          top: 0;
          z-index: 1;
        }
        .tl-content {
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 1.25rem;
          border: 1px solid #e2e8f0;
          strong { color: #000000; font-size: 1.1rem; }
        }
      }
    }

    .loading-state {
      height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      p { color: #64748b; font-weight: 600; }
    }

    @media (max-width: 1024px) {
      .detail-grid { grid-template-columns: 1fr; }
      .timeline-card { grid-column: span 1; }
      .doc-grid { grid-template-columns: 1fr; }
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
    await this.pdfService.generateResidentBiodata(resident, family as Family);
  }
}
