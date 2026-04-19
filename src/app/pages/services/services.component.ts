import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServiceRequest, AppUser, Resident } from '../../models/data.models';
import { AuthService } from '../../services/auth.service';
import { LetterService } from '../../services/letter.service';
import { of, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="header-actions mb-6">
      <div class="titles">
        <h2 class="title-gradient">Pusat Layanan Administrasi</h2>
        <p class="text-muted">Akses cepat layanan kependudukan digital untuk warga</p>
      </div>
    </div>

    <div class="services-grid">
      <div *ngFor="let s of services" class="service-card card-luxury" (click)="openRequest(s)">
        <div class="icon-box">{{ s.icon }}</div>
        <div class="info">
          <h3>{{ s.name }}</h3>
          <p>{{ s.desc }}</p>
        </div>
        <button class="btn-primary-sm">Ajukan</button>
      </div>
    </div>

    <div class="mt-12">
      <h3 class="mb-4">Daftar Pengajuan Terbaru</h3>
      <div class="card-luxury p-0 overflow-hidden">
        <table class="luxury-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>NIK Pemohon</th>
              <th>Layanan</th>
              <th>Alasan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of recentRequests()" 
              (click)="canManage() ? openManagementModal(req) : null" 
              [class.clickable-row]="canManage()">
              <td>{{ req.created_at?.toDate() | date:'dd MMM yyyy HH:mm' }}</td>
              <td class="nik-cell">{{ req.nik }}</td>
              <td>{{ req.service_type }}</td>
              <td>{{ req.reason }}</td>
              <td><span class="badge" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span></td>
              <td>
                <a *ngIf="req.letter_url" [href]="req.letter_url" target="_blank" class="btn-download-mini" title="Download Surat">
                  📄
                </a>
              </td>
            </tr>
            <tr *ngIf="recentRequests().length === 0">
              <td colspan="5" class="empty-state">Belum ada pengajuan layanan.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Request Modal -->
    <div *ngIf="activeService()" class="form-overlay" (click)="activeService.set(null)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <h3>Pengajuan: {{ activeService()?.name }}</h3>
        <p class="text-muted mb-4">Lengkapi data berikut untuk memproses permohonan</p>
        
        <form (submit)="submitRequest()">
          <div class="form-grid">
            <div class="input-group">
              <label>NIK Pemohon</label>
              <input [(ngModel)]="requestForm.nik" name="nik" 
                [placeholder]="isWarga() ? '' : 'Masukkan 16 digit NIK'" 
                [disabled]="isWarga()" required>
            </div>
            <div class="input-group">
              <label>Alasan Permohonan</label>
              <input [(ngModel)]="requestForm.reason" name="reason" placeholder="Contoh: Hilang/Rusak" required>
            </div>
            <div class="input-group full-width" style="grid-column: 1 / -1;">
              <label>Dokumen Pendukung (Pilih beberapa jika perlu)</label>
              <div class="upload-zone" (click)="fileInput.click()">
                <span>📁 Klik untuk unggah KTP/KK/Surat Pengantar</span>
                <input #fileInput type="file" (change)="onFileSelected($event)" multiple hidden>
              </div>
              <div class="file-list" *ngIf="selectedFiles.length > 0">
                <div *ngFor="let f of selectedFiles; let i = index" class="file-chip">
                  {{ f.name }} <button type="button" (click)="removeFile(i)">×</button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-actions mt-6">
            <button type="button" class="btn-text" (click)="activeService.set(null)">Batal</button>
            <button type="submit" class="btn-primary" [disabled]="isSubmitting()">
              {{ isSubmitting() ? 'Mengirim...' : 'Kirim Permohonan' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Success Toast -->
    <div *ngIf="showSuccess()" class="toast-success glass-panel">
      <span>✅</span>
      <p>Operasi berhasil diperbarui!</p>
    </div>

    <!-- Management Modal -->
    <div *ngIf="selectedRequest()" class="form-overlay" (click)="selectedRequest.set(null)">
      <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
        <header class="modal-header">
          <h3>Kelola Pengajuan</h3>
          <span class="status-indicator" [attr.data-status]="selectedRequest()?.status">
            {{ selectedRequest()?.status }}
          </span>
        </header>
        
        <div class="request-summary mb-6">
          <div class="sum-item">
            <label>NIK Pemohon</label>
            <p>{{ selectedRequest()?.nik }}</p>
          </div>
          <div class="sum-item">
            <label>Layanan</label>
            <p>{{ selectedRequest()?.service_type }}</p>
          </div>
          <div class="sum-item">
            <label>Alasan</label>
            <p>{{ selectedRequest()?.reason }}</p>
          </div>
        </div>

        <form (submit)="saveStatusUpdate()">
          <div class="form-grid">
            <div class="input-group">
              <label>Pembaruan Status</label>
              <select [(ngModel)]="managementForm.status" name="mStatus" [disabled]="selectedRequest()?.status === 'Selesai'">
                <option value="Pending">Pending</option>
                <option value="Diproses">Diproses</option>
                <option value="Selesai">Selesai (Final)</option>
                <option value="Ditolak">Ditolak</option>
              </select>
              <p *ngIf="selectedRequest()?.status === 'Selesai'" class="text-xs text-muted mt-1 italic">
                ⚠️ Pengajuan yang sudah selesai tidak dapat diubah lagi.
              </p>
            </div>
            <div class="input-group full-width" style="grid-column: 1 / -1;">
              <label>Catatan Admin (Notes)</label>
              <textarea [(ngModel)]="managementForm.admin_note" name="mNote" placeholder="Tambahkan instruksi atau alasan di sini..." rows="3"></textarea>
            </div>

            <!-- Attachments Review -->
            <div class="input-group full-width" style="grid-column: 1 / -1;" *ngIf="selectedRequest()?.attachments?.length">
              <label>Dokumen Pendukung dari Warga</label>
              <div class="attachment-gallery">
                <a *ngFor="let url of selectedRequest()?.attachments; let i = index" [href]="url" target="_blank" class="attachment-preview">
                  Berkas {{ i + 1 }}
                </a>
              </div>
            </div>
          </div>
          <div class="form-actions mt-8">
            <button type="button" class="btn-text" (click)="selectedRequest.set(null)">Tutup</button>
            <button type="submit" class="btn-primary" [disabled]="selectedRequest()?.status === 'Selesai' || isSubmittingManagement()">
              {{ isSubmittingManagement() ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
            <button *ngIf="managementForm.status === 'Selesai' && selectedRequest()?.status !== 'Selesai'" type="button" 
              (click)="approveAndGenerateLetter()" class="btn-success" [disabled]="isSubmittingManagement()">
              {{ isSubmittingManagement() ? 'Generating...' : 'Cetak & Selesaikan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .service-card {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 10px 30px -10px var(--primary-glow); }
      .icon-box { font-size: 2.5rem; background: rgba(255,255,255,0.02); width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border-radius: 1rem; }
      .info { flex: 1; h3 { font-size: 1.1rem; margin-bottom: 0.25rem; } p { font-size: 0.8rem; color: var(--text-muted); } }
      .btn-primary-sm { background: var(--primary); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
    }
    .mt-12 { margin-top: 3rem; }
    .luxury-table {
      width: 100%;
      border-collapse: collapse;
      th { text-align: left; padding: 1rem 1.5rem; color: var(--text-muted); font-size: 0.8rem; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border-color); }
      td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.85rem; }
      .nik-cell { color: var(--primary); font-family: monospace; }
      .badge {
        padding: 0.2rem 0.6rem;
        border-radius: 1rem;
        font-size: 0.7rem;
        text-transform: uppercase;
        font-weight: 600;
        &.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        &.diproses { background: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.2); }
        &.selesai { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
      }
    }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .form-card { width: 450px; padding: 2rem; }
    .form-grid { display: grid; gap: 1.25rem; }
    .input-group { display: flex; flex-direction: column; gap: 0.5rem; label { font-size: 0.8rem; color: var(--text-muted); } }
    input { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 0.5rem; color: white; outline: none; &:focus { border-color: var(--primary); } }
    .upload-area { border: 2px dashed var(--border-color); text-align: center; padding: 1.5rem; color: var(--text-muted); span { font-size: 1.5rem; } p { font-size: 0.8rem; margin: 0.5rem 0; } small { font-size: 0.7rem; } }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-text { background: none; border: none; color: var(--text-muted); cursor: pointer; }
    .toast-success { position: fixed; bottom: 2rem; right: 2rem; display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; border-radius: 1rem; border: 1px solid #10b981; background: rgba(16, 185, 129, 0.1); backdrop-filter: blur(10px); animation: slideUp 0.3s ease; z-index: 2000; }
    @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .p-0 { padding: 0 !important; }
    .overflow-hidden { overflow: hidden; }
    .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }
    .clickable-row { cursor: pointer; &:hover td { background: rgba(var(--primary-rgb), 0.05) !important; color: #fff; } }

    /* Management Modal Extra */
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .status-indicator { font-size: 0.7rem; padding: 0.3rem 0.75rem; border-radius: 0.5rem; background: rgba(255,255,255,0.05); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid rgba(255,255,255,0.1); 
      &[data-status='Selesai'] { color: #10b981; border-color: #10b981; }
      &[data-status='Diproses'] { color: #3b82f6; border-color: #3b82f6; }
      &[data-status='Pending'] { color: #f59e0b; border-color: #f59e0b; }
      &[data-status='Ditolak'] { color: #ef4444; border-color: #ef4444; }
    }
    .request-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; border-radius: 0.75rem; background: rgba(255,255,255,0.02); 
      .sum-item { label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.2rem; } p { font-size: 0.9rem; font-weight: 500; } }
    }
    textarea { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 0.5rem; color: white; outline: none; width: 100%; font-family: inherit; &:focus { border-color: var(--primary); } }
    select { background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 0.5rem; color: white; outline: none; appearance: none;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-download-mini {
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
      color: #10b981; padding: 0.4rem; border-radius: 0.4rem; font-size: 0.9rem; cursor: pointer;
      &:hover { background: rgba(16, 185, 129, 0.2); }
    }
    .upload-zone {
      background: rgba(255,255,255,0.03); border: 1px dashed var(--border-color);
      padding: 1.5rem; border-radius: 0.75rem; text-align: center; cursor: pointer;
      color: var(--text-muted); font-size: 0.85rem; transition: all 0.2s;
      &:hover { border-color: var(--primary); background: rgba(255,255,255,0.05); }
    }
    .file-list {
      display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;
    }
    .file-chip {
      background: rgba(255,255,255,0.05); border: 1px solid var(--border-color);
      padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; display: flex; align-items: center; gap: 0.5rem;
      button { background: none; border: none; color: #ef4444; font-weight: bold; cursor: pointer; padding: 0; }
    }
    .attachment-gallery {
      display: flex; flex-wrap: wrap; gap: 0.5rem;
    }
    .attachment-preview {
      background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2);
      color: var(--primary); padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8rem; text-decoration: none;
      &:hover { background: rgba(99, 102, 241, 0.2); }
    }
    .btn-success {
      background: #10b981; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem;
      font-weight: 600; cursor: pointer; transition: all 0.2s;
      &:hover { background: #059669; transform: translateY(-1px); }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }
  `]
})
export class ServicesComponent {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private letterService = inject(LetterService);

  userProfile: AppUser | null = null;

  services = [
    { icon: '🆔', name: 'Update E-KTP', desc: 'Perubahan status, foto, atau alamat pada KTP elektronik.' },
    { icon: '👶', name: 'Akta Kelahiran', desc: 'Permohonan akta untuk anggota keluarga baru.' },
    { icon: '⛪', name: 'Update Data Agama', desc: 'Penyesuaian kolom agama pada KK dan KTP.' },
    { icon: '⚰️', name: 'Akta Kematian', desc: 'Pelaporan dan penerbitan akta kematian warga.' }
  ];

  activeService = signal<any>(null);
  selectedRequest = signal<ServiceRequest | null>(null);
  showSuccess = signal(false);
  isSubmitting = signal(false);
  isSubmittingManagement = signal(false);
  recentRequests = signal<ServiceRequest[]>([]);

  requestForm: any = { nik: '', reason: '' };
  managementForm: any = { status: '', admin_note: '' };
  selectedFiles: File[] = [];

  constructor() {
    this.authService.userData$.subscribe(u => {
      this.userProfile = u;
      this.loadRequests();
    });
  }

  loadRequests() {
    if (!this.userProfile) return;
    
    const obs = this.userProfile.role === 'warga' 
      ? this.dataService.getResidentRequests(this.userProfile.nik || '')
      : this.dataService.getRequests();

    obs.subscribe(reqs => this.recentRequests.set(reqs));
  }

  isWarga() { return this.userProfile?.role === 'warga'; }
  canManage() { return this.userProfile?.role === 'admin' || this.userProfile?.role === 'petugas'; }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.selectedFiles.push(...Array.from(files as FileList));
    }
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  openRequest(service: any) {
    this.activeService.set(service);
    this.requestForm = { 
      nik: this.userProfile?.nik || '', 
      reason: '' 
    };
    this.selectedFiles = [];
  }

  async submitRequest() {
    if (!this.requestForm.nik || !this.requestForm.reason) return;
    
    this.isSubmitting.set(true);
    try {
      let attachmentUrls: string[] = [];
      if (this.selectedFiles.length > 0) {
        attachmentUrls = await this.dataService.uploadMultipleFiles(this.selectedFiles, `requests/${this.requestForm.nik}`);
      }

      const newReq: ServiceRequest = {
        nik: this.requestForm.nik,
        service_type: this.activeService().name,
        reason: this.requestForm.reason,
        status: 'Pending',
        attachments: attachmentUrls,
        created_at: null
      };

      await this.dataService.addRequest(newReq);
      this.activeService.set(null);
      this.showSuccess.set(true);
      setTimeout(() => this.showSuccess.set(false), 3000);
    } catch (e) {
      console.error(e);
      alert('Gagal mengirim permohonan. Silakan coba lagi.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  openManagementModal(req: ServiceRequest) {
    this.selectedRequest.set(req);
    this.managementForm = {
      status: req.status,
      admin_note: req.admin_note || ''
    };
  }

  async saveStatusUpdate() {
    const original = this.selectedRequest();
    if (!original || !original.id) return;

    this.isSubmittingManagement.set(true);
    try {
      await this.dataService.updateRequestStatus(
        original.id, 
        this.managementForm.status, 
        this.managementForm.admin_note
      );
      this.selectedRequest.set(null);
      this.showSuccess.set(true);
      setTimeout(() => this.showSuccess.set(false), 3000);
      this.loadRequests();
    } catch (e) {
      console.error(e);
      alert('Gagal memperbarui status.');
    } finally {
      this.isSubmittingManagement.set(false);
    }
  }

  async approveAndGenerateLetter() {
    const req = this.selectedRequest();
    if (!req?.id) return;

    this.isSubmittingManagement.set(true);
    try {
      const resident = await this.dataService.getResidentByNikSync(req.nik);
      if (!resident) throw new Error('Data penduduk dengan NIK tersebut tidak ditemukan di sistem kependudukan.');

      const letterUrl = await this.letterService.generateAndUpload(req, resident);
      
      await this.dataService.updateRequestFull(req.id, {
        status: 'Selesai',
        admin_note: this.managementForm.admin_note || 'Surat telah diterbitkan secara digital.',
        letter_url: letterUrl,
        processed_by: this.userProfile?.email || 'System'
      });

      this.selectedRequest.set(null);
      this.showSuccess.set(true);
      setTimeout(() => this.showSuccess.set(false), 3000);
      this.loadRequests();

      // Implement WA Notification Prompt
      if (resident.phone) {
        const confirmWa = confirm(`Surat berhasil dicetak! Ingin mengirim notifikasi WhatsApp otomatis ke ${resident.full_name} (${resident.phone})?`);
        if (confirmWa) {
          const text = encodeURIComponent(`Halo ${resident.full_name},\n\nPermohonan layanan *${req.service_type}* Anda telah selesai diproses oleh Pemerintah Desa Maju Jaya.\n\nAnda dapat mengunduh surat resmi digital dengan *E-Signature* di sini:\n${letterUrl}\n\nTerima kasih atas kepercayaan Anda kepada DigiWarga.`);
          const waUrl = `https://wa.me/${resident.phone.replace(/^0/, '62')}?text=${text}`;
          window.open(waUrl, '_blank');
        }
      } else {
         alert('Surat berhasil dicetak. (Warga ini belum mendaftarkan nomor telepon untuk notifikasi WA)');
      }

    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Gagal generate surat');
    } finally {
      this.isSubmittingManagement.set(false);
    }
  }
}
