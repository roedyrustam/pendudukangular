import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServiceRequest } from '../../models/data.models';

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
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let req of recentRequests()">
              <td>{{ req.created_at?.toDate() | date:'dd MMM yyyy HH:mm' }}</td>
              <td class="nik-cell">{{ req.nik }}</td>
              <td>{{ req.service_type }}</td>
              <td>{{ req.reason }}</td>
              <td><span class="badge" [ngClass]="req.status.toLowerCase()">{{ req.status }}</span></td>
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
              <input [(ngModel)]="requestForm.nik" name="nik" placeholder="Masukkan 16 digit NIK" required>
            </div>
            <div class="input-group">
              <label>Alasan Permohonan</label>
              <input [(ngModel)]="requestForm.reason" name="reason" placeholder="Contoh: Hilang/Rusak" required>
            </div>
            <div class="upload-area card-luxury">
              <span>📄</span>
              <p>Upload Scan KK/KTP (PDF/JPG)</p>
              <small class="text-muted">Fitur upload dokumen akan tersedia segera</small>
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
      <p>Permohonan telah berhasil dikirim ke sistem pusat!</p>
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
  `]
})
export class ServicesComponent {
  private dataService = inject(DataService);

  services = [
    { icon: '🆔', name: 'Update E-KTP', desc: 'Perubahan status, foto, atau alamat pada KTP elektronik.' },
    { icon: '👶', name: 'Akta Kelahiran', desc: 'Permohonan akta untuk anggota keluarga baru.' },
    { icon: '⛪', name: 'Update Data Agama', desc: 'Penyesuaian kolom agama pada KK dan KTP.' },
    { icon: '⚰️', name: 'Akta Kematian', desc: 'Pelaporan dan penerbitan akta kematian warga.' }
  ];

  activeService = signal<any>(null);
  showSuccess = signal(false);
  isSubmitting = signal(false);
  recentRequests = signal<ServiceRequest[]>([]);

  requestForm: any = { nik: '', reason: '' };

  constructor() {
    this.dataService.getRequests().subscribe(reqs => this.recentRequests.set(reqs));
  }

  openRequest(service: any) {
    this.activeService.set(service);
    this.requestForm = { nik: '', reason: '' };
  }

  async submitRequest() {
    if (!this.requestForm.nik || !this.requestForm.reason) return;
    
    this.isSubmitting.set(true);
    const newReq: ServiceRequest = {
      nik: this.requestForm.nik,
      service_type: this.activeService().name,
      reason: this.requestForm.reason,
      status: 'Pending',
      created_at: null
    };

    try {
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
}
