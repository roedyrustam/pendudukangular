import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServiceRequest, AppUser, Resident } from '../../models/data.models';
import { AuthService } from '../../services/auth.service';
import { LetterService } from '../../services/letter.service';
import { NotificationService } from '../../services/notification.service';
import { of, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="services-page fade-in">
      <header class="header-actions mb-10 flex-between items-start">
        <div class="titles">
          <h2 class="title-gradient text-4xl">Pusat Layanan Administrasi</h2>
          <p class="text-muted text-lg mt-2">Akses cepat layanan kependudukan digital dengan validasi E-Signature.</p>
        </div>
        <div class="header-right flex flex-col items-end gap-4">
          <div class="live-status bg-blue-50 px-5 py-2 rounded-full border border-blue-100 flex items-center gap-3">
             <span class="text-[10px] font-black text-primary tracking-widest uppercase">SERVER STATUS:</span>
             <div class="pulse-dot"></div>
             <span class="label text-primary font-black uppercase text-[10px]">OPERATIONAL</span>
          </div>
        </div>
      </header>

      <!-- Bento Service Grid -->
      <section class="services-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        <article *ngFor="let s of services" class="service-card card-luxury p-8 group hover:border-primary/30 transition-all duration-500 cursor-pointer" (click)="openRequest(s)">
          <div class="icon-wrapper mb-8 bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl group-hover:bg-primary/5 group-hover:scale-110 transition-all">
            {{ s.icon }}
          </div>
          <h3 class="text-slate-900 font-black text-xl mb-3 group-hover:text-primary transition-colors">{{ s.name }}</h3>
          <p class="text-slate-500 font-bold text-xs leading-relaxed mb-8 line-clamp-2">{{ s.desc }}</p>
          <button class="btn-outline w-full py-3 rounded-xl border-2 font-black text-[10px] tracking-widest uppercase group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all">
            AJUKAN SEKARANG ⚡
          </button>
        </article>
      </section>

      <!-- Table Section -->
      <section class="mt-12">
        <div class="flex-between mb-8">
           <h3 class="text-slate-900 font-black text-2xl uppercase tracking-tighter">Daftar Pengajuan Terbaru</h3>
           <div class="flex gap-2">
             <span class="badge secondary font-black text-[10px] uppercase px-4 py-2">LIVE MONITORING</span>
           </div>
        </div>

        <main class="card-luxury p-0 overflow-hidden shadow-2xl border-slate-200">
          <table class="luxury-table w-full">
            <thead>
              <tr class="bg-slate-50">
                <th class="py-5 px-8 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">WAKTU PENGAJUAN</th>
                <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">NIK PEMOHON</th>
                <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">JENIS LAYANAN</th>
                <th class="py-5 px-6 text-left text-[10px] font-black text-slate-400 tracking-widest uppercase">ALASAN / KEPERLUAN</th>
                <th class="py-5 px-6 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">STATUS</th>
                <th class="py-5 px-8 text-right text-[10px] font-black text-slate-400 tracking-widest uppercase">SURAT</th>
                <th class="py-5 px-8 text-center text-[10px] font-black text-slate-400 tracking-widest uppercase">AKSI</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of paginatedRequests()" 
                class="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td class="py-5 px-8 text-xs font-bold text-slate-500 uppercase">{{ req.created_at | date:'dd MMM yyyy HH:mm' }}</td>
                <td class="py-5 px-6 font-black text-primary font-mono tracking-tighter">{{ req.nik }}</td>
                <td class="py-5 px-6 font-black text-slate-900">{{ req.service_type }}</td>
                <td class="py-5 px-6">
                  <div class="text-slate-500 font-bold text-xs truncate max-w-[200px]">{{ req.reason }}</div>
                </td>
                <td class="py-5 px-6 text-center">
                  <span class="status-badge" [attr.data-status]="req.status.toLowerCase()">{{ req.status }}</span>
                </td>
                <td class="py-5 px-8 text-right">
                  <a *ngIf="req.letter_url" [href]="req.letter_url" target="_blank" class="btn-icon-sm bg-emerald-50 text-emerald-600 border-emerald-100" (click)="$event.stopPropagation()" title="Download Surat">
                    📄
                  </a>
                  <span *ngIf="!req.letter_url" class="text-[10px] font-black text-slate-300">N/A</span>
                </td>
                <td class="py-5 px-8 text-center" *ngIf="canManage()">
                  <div class="flex gap-2 justify-center">
                    <button class="btn-icon" (click)="openManagementModal(req)" title="Kelola Permohonan">⚙️</button>
                    <button class="btn-icon bg-green-500/10 text-green-600 border-green-200" 
                      (click)="sendManualNotification(req)" title="Kirim Notifikasi WA">
                      📱
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="recentRequests().length === 0">
                <td colspan="7" class="py-20 text-center">
                   <div class="text-5xl mb-4">📮</div>
                   <p class="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada pengajuan layanan aktif</p>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Footer -->
          <footer class="pagination-area bg-slate-50 p-6 flex-between border-t border-slate-100" *ngIf="recentRequests().length > pageSize()">
             <div class="text-xs font-bold text-slate-500 uppercase tracking-widest">
                MENAMPILKAN <b class="text-slate-900">{{ startRange() }}-{{ endRange() }}</b> DARI <b class="text-slate-900">{{ recentRequests().length }}</b> DATA
             </div>
             <nav class="flex gap-2">
                <button class="btn-page" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">⬅️ PREV</button>
                <div class="flex gap-1">
                   <button *ngFor="let p of totalPagesArray()" class="btn-page-num" [class.active]="p === currentPage()" (click)="goToPage(p)">{{ p }}</button>
                </div>
                <button class="btn-page" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">NEXT ➡️</button>
             </nav>
          </footer>
        </main>
      </section>
    </div>

    <!-- Request Modal -->
    <div *ngIf="activeService()" class="form-overlay fade-in" (click)="activeService.set(null)">
      <div class="form-card card-luxury p-10" (click)="$event.stopPropagation()">
        <header class="modal-header mb-10">
          <h2 class="title-gradient text-3xl">Pengajuan: {{ activeService()?.name }}</h2>
          <p class="text-muted text-lg mt-2">Lengkapi data berikut untuk memproses permohonan surat resmi.</p>
        </header>
        
        <form (submit)="submitRequest()" class="grid grid-cols-2 gap-8">
            <div class="input-group">
              <label class="text-slate-900 font-black mb-3 block">NIK PEMOHON</label>
              <input [(ngModel)]="requestForm.nik" name="nik" 
                class="custom-input font-black text-lg"
                [placeholder]="isWarga() ? '' : '16 Digit NIK'" 
                [disabled]="isWarga()" required>
            </div>
            <div class="input-group">
              <label class="text-slate-900 font-black mb-3 block">NO. WHATSAPP AKTIF</label>
              <input [(ngModel)]="requestForm.phone_active" name="phone_active" placeholder="08..." required class="custom-input font-black text-lg">
            </div>
            <div class="input-group col-span-2">
              <label class="text-slate-900 font-black mb-3 block">ALASAN / KEPERLUAN PERMOHONAN</label>
              <textarea [(ngModel)]="requestForm.reason" name="reason" placeholder="Contoh: Persyaratan melamar pekerjaan, beasiswa, dsb." required class="custom-input font-bold min-h-[100px] py-4"></textarea>
            </div>
            <div class="input-group col-span-2">
              <label class="text-slate-900 font-black mb-3 block uppercase text-[10px] tracking-widest">DOKUMEN PENDUKUNG (UPLOAD)</label>
              <div class="upload-zone p-8 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-4 group hover:border-primary transition-all cursor-pointer" (click)="fileInput.click()">
                <span class="text-4xl group-hover:scale-110 transition-transform">📂</span>
                <div class="text-center">
                  <p class="text-slate-900 font-black text-sm">Klik untuk pilih berkas pendukung</p>
                  <p class="text-slate-400 font-bold text-[10px] mt-1 uppercase tracking-widest">KTP / KK / Surat Pengantar (Format PDF/JPG)</p>
                </div>
                <input #fileInput type="file" (change)="onFileSelected($event)" multiple hidden>
              </div>
              <div class="file-list mt-4 flex flex-wrap gap-2" *ngIf="selectedFiles.length > 0">
                <div *ngFor="let f of selectedFiles; let i = index" class="file-chip px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                  <span class="text-primary font-bold text-xs">{{ f.name }}</span>
                  <button type="button" class="text-rose-500 font-black hover:scale-125 transition-transform" (click)="removeFile(i)">×</button>
                </div>
              </div>
            </div>

            <footer class="col-span-2 pt-10 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" class="btn-outline px-8 rounded-xl font-black text-xs" (click)="activeService.set(null)">BATAL</button>
              <button type="submit" class="btn-primary px-12 py-5 rounded-2xl shadow-2xl font-black" [disabled]="isSubmitting()">
                {{ isSubmitting() ? 'SEDANG MENGIRIM...' : 'KIRIM PERMOHONAN 🚀' }}
              </button>
            </footer>
        </form>
      </div>
    </div>

    <!-- Management Modal -->
    <div *ngIf="selectedRequest()" class="form-overlay fade-in" (click)="selectedRequest.set(null)">
      <div class="form-card card-luxury p-10" (click)="$event.stopPropagation()">
        <header class="modal-header flex justify-between items-start border-b border-slate-100 pb-8 mb-10">
          <div>
            <h2 class="title-gradient text-3xl">Kelola Pengajuan Layanan</h2>
            <p class="text-slate-900 font-black text-sm mt-1 uppercase tracking-widest">MANAJEMEN ADMINISTRASI DESA</p>
          </div>
          <span class="status-badge large" [attr.data-status]="selectedRequest()?.status?.toLowerCase()">
            {{ selectedRequest()?.status }}
          </span>
        </header>
        
        <div class="summary-grid grid grid-cols-3 gap-6 mb-10 p-6 bg-slate-50 rounded-3xl">
          <div class="sum-item">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">NIK PEMOHON</label>
            <p class="text-primary font-black font-mono tracking-tighter">{{ selectedRequest()?.nik }}</p>
          </div>
          <div class="sum-item">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">JENIS LAYANAN</label>
            <p class="text-slate-900 font-black">{{ selectedRequest()?.service_type }}</p>
          </div>
          <div class="sum-item">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">PHONE / WA</label>
            <p class="text-slate-900 font-black">{{ selectedRequest()?.phone_active }}</p>
          </div>
        </div>

        <form (submit)="saveStatusUpdate()" class="grid grid-cols-1 gap-8">
            <div class="input-group">
              <label class="text-slate-900 font-black mb-3 block">PEMBARUAN STATUS LAYANAN</label>
              <select [(ngModel)]="managementForm.status" name="mStatus" 
                class="custom-select font-black text-lg"
                [disabled]="selectedRequest()?.status === 'Selesai'">
                <option value="Pending">Pending (Menunggu)</option>
                <option value="Diproses">Diproses (Verifikasi)</option>
                <option value="Selesai">Selesai (Terbit Surat)</option>
                <option value="Ditolak">Ditolak (Data Tidak Valid)</option>
              </select>
            </div>
            <div class="input-group">
              <label class="text-slate-900 font-black mb-3 block">CATATAN ADMINISTRASI (INTERNAL/EXTERNAL)</label>
              <textarea [(ngModel)]="managementForm.admin_note" name="mNote" placeholder="Tulis catatan verifikasi atau alasan penolakan..." class="custom-input font-bold min-h-[120px] py-4"></textarea>
            </div>

            <footer class="pt-10 border-t border-slate-100 flex justify-end gap-4">
              <button type="button" class="btn-outline px-8 rounded-xl font-black text-xs" (click)="selectedRequest.set(null)">TUTUP</button>
              <button type="submit" class="btn-primary px-10 py-5 rounded-2xl shadow-xl font-black" [disabled]="isSubmittingManagement()">
                {{ isSubmittingManagement() ? 'MENYIMPAN...' : 'UPDATE STATUS ✅' }}
              </button>
            </footer>
        </form>
      </div>
    </div>

    <!-- Success Notification -->
    <div *ngIf="showSuccess()" class="toast-success fade-in fixed bottom-10 right-10 z-[3000] bg-emerald-500 text-white p-6 rounded-3xl shadow-2xl flex items-center gap-4">
      <span class="text-2xl">✅</span>
      <div>
        <p class="font-black text-sm uppercase tracking-widest">Berhasil!</p>
        <p class="font-bold text-xs opacity-90">Data layanan telah berhasil diperbarui.</p>
      </div>
    </div>
  `,
  styles: [`
    .services-page { padding-bottom: 5rem; }
    .btn-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: white; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: 0.2s; }
    .btn-icon:hover { background: #f8fafc; border-color: var(--primary); }
    .pulse-dot { width: 10px; height: 10px; background: #3b82f6; border-radius: 50%; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }

    .custom-select, .custom-input {
       width: 100%; background: #f8fafc; border: 1px solid var(--glass-border); padding: 1rem 1.25rem; border-radius: 1.25rem;
       outline: none; font-weight: 600; font-size: 1rem; color: #000; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }

    .status-badge {
       padding: 0.4rem 1rem; border-radius: 1rem; font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; display: inline-block;
       &.large { font-size: 0.85rem; padding: 0.6rem 1.5rem; border-radius: 1.25rem; }
       &[data-status='pending'] { background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }
       &[data-status='diproses'] { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
       &[data-status='selesai'] { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
       &[data-status='ditolak'] { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    }

    .btn-page-num {
       width: 44px; height: 44px; border-radius: 12px; font-weight: 900; color: #64748b; transition: 0.3s;
       &.active { background: var(--primary); color: white; box-shadow: 0 10px 20px var(--primary-glow); }
    }

    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.9); backdrop-filter: blur(25px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 850px; max-height: 90vh; overflow-y: auto; }
  `]
})
export class ServicesComponent implements OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private letterService = inject(LetterService);
  private notificationService = inject(NotificationService);

  userProfile: AppUser | null = null;

  services = [
    { id_surat: '1', icon: '🆔', name: 'Update E-KTP', desc: 'Perubahan status, foto, atau alamat pada KTP elektronik.' },
    { id_surat: '2', icon: '👶', name: 'Akta Kelahiran', desc: 'Permohonan akta untuk anggota keluarga baru.' },
    { id_surat: '3', icon: '⛪', name: 'Update Data Agama', desc: 'Penyesuaian kolom agama pada KK dan KTP.' },
    { id_surat: '4', icon: '⚰️', name: 'Akta Kematian', desc: 'Pelaporan dan penerbitan akta kematian warga.' }
  ];

  activeService = signal<any>(null);
  selectedRequest = signal<ServiceRequest | null>(null);
  showSuccess = signal(false);
  isSubmitting = signal(false);
  isSubmittingManagement = signal(false);
  recentRequests = signal<ServiceRequest[]>([]);
  private subscriptions: any[] = [];

  // Pagination Signals
  currentPage = signal(1);
  pageSize = signal(10);

  paginatedRequests = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.recentRequests().slice(start, end);
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.recentRequests().length / this.pageSize())));
  totalPagesArray = computed(() => {
    const pages = this.totalPages();
    const current = this.currentPage();
    let start = Math.max(1, current - 2);
    let end = Math.min(pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => Math.max(1, start + i));
  });

  startRange = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  endRange = computed(() => Math.min(this.currentPage() * this.pageSize(), this.recentRequests().length));

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
    }
  }

  requestForm: any = { nik: '', reason: '' };
  managementForm: any = { status: '', admin_note: '' };
  selectedFiles: File[] = [];

  constructor() {
    this.authService.userData$.subscribe(u => {
      this.userProfile = u;
      this.loadRequests();
    });

    this.subscriptions.push(
      this.dataService.subscribeToRequests(() => this.loadRequests())
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
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
      reason: '',
      phone_active: this.userProfile?.phone || ''
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

      const newReq: any = {
        nik: this.requestForm.nik,
        service_type: this.activeService().name,
        id_surat: this.activeService().id_surat,
        reason: this.requestForm.reason,
        phone_active: this.requestForm.phone_active,
        status: 'Pending',
        attachments: attachmentUrls,
        created_at: ''
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

      // Ask to send notification for any status change
      const resident = await this.dataService.getResidentByNikSync(original.nik);
      if (resident?.phone) {
        if (confirm(`Status diperbarui ke "${this.managementForm.status}". Kirim notifikasi WhatsApp ke warga?`)) {
          this.notificationService.sendWhatsAppNotification({ ...original, ...this.managementForm }, resident);
        }
      }
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

      if (resident.phone) {
        if (confirm(`Surat berhasil dicetak! Ingin mengirim notifikasi WhatsApp otomatis ke ${resident.full_name}?`)) {
          this.notificationService.sendWhatsAppNotification({ ...req, status: 'Selesai', letter_url: letterUrl }, resident);
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

  async sendManualNotification(req: ServiceRequest) {
    const resident = await this.dataService.getResidentByNikSync(req.nik);
    if (resident?.phone) {
      this.notificationService.sendWhatsAppNotification(req, resident);
    } else {
      alert('Warga ini belum mendaftarkan nomor telepon.');
    }
  }
}
