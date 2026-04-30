import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-container fade-in">
      <header class="mb-8">
        <h2 class="title-gradient">Pengaturan Akun</h2>
        <p class="text-muted">Kelola informasi profil dan keamanan login Anda.</p>
      </header>

      <div class="settings-grid">
        <!-- Profile Card -->
        <div class="card-luxury glass-panel p-6">
          <div class="section-title mb-6">
            <span class="icon">👤</span>
            <div>
              <h3>Informasi Profil</h3>
              <p class="text-xs text-muted">Nama ini akan muncul di seluruh aplikasi.</p>
            </div>
          </div>

          <form (submit)="updateProfile()">
            <div class="input-group mb-4">
              <label>Nama Lengkap / Display Name</label>
              <input [(ngModel)]="displayName" name="displayName" placeholder="Contoh: Admin DigiWarga" required>
            </div>
            <div class="input-group mb-4" *ngIf="user$ | async as user">
              <label>Email Address</label>
              <input [value]="user.email" disabled class="opacity-50">
              <small class="text-xs text-muted mt-1 italic">* Email tidak dapat diubah secara langsung.</small>
            </div>
            <button type="submit" class="btn-primary w-full" [disabled]="loadingProfile()">
              {{ loadingProfile() ? 'Menyimpan...' : 'Simpan Perubahan Profil' }}
            </button>
          </form>
          
          <div *ngIf="profileMessage()" class="status-msg mt-4" [class.success]="isProfileSuccess()">
            {{ profileMessage() }}
          </div>
        </div>

        <!-- Security Card -->
        <div class="card-luxury glass-panel p-6">
          <div class="section-title mb-6">
            <span class="icon">🔒</span>
            <div>
              <h3>Keamanan & Password</h3>
              <p class="text-xs text-muted">Pastikan password Anda kuat dan rahasia.</p>
            </div>
          </div>

          <form (submit)="changePassword()">
            <div class="input-group mb-4">
              <label>Password Baru</label>
              <input type="password" [(ngModel)]="newPassword" name="newPassword" placeholder="Minimum 6 karakter" required>
            </div>
            <div class="input-group mb-6">
              <label>Konfirmasi Password</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword" placeholder="Ketik ulang password baru" required>
            </div>
            <button type="submit" class="btn-outline w-full" [disabled]="loadingSecurity()">
              {{ loadingSecurity() ? 'Sedang Memproses...' : 'Perbarui Password' }}
            </button>
          </form>

          <div *ngIf="securityMessage()" class="status-msg mt-4" [class.success]="isSecuritySuccess()">
            {{ securityMessage() }}
          </div>
        </div>
      </div>

      <div class="footer-note mt-8 p-4 text-center glass-panel" *ngIf="user$ | async as user">
        <p class="text-muted text-xs">Login aktif sejak: {{ user.last_sign_in_at | date:'medium' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      .icon {
        font-size: 1.5rem;
        background: rgba(255,255,255,0.05);
        padding: 0.75rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
      }
      h3 { margin: 0; font-size: 1.1rem; }
    }
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
      input {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-color);
        padding: 0.8rem 1rem;
        border-radius: 0.75rem;
        color: white;
        font-size: 0.95rem;
        transition: all 0.3s;
        &:focus {
          border-color: var(--primary);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.2);
        }
      }
    }
    .btn-outline {
      background: none;
      border: 1px solid var(--primary);
      color: var(--primary);
      padding: 0.8rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      &:hover:not(:disabled) {
        background: rgba(99, 102, 241, 0.1);
        transform: translateY(-2px);
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .status-msg {
      padding: 0.75rem;
      border-radius: 0.5rem;
      background: rgba(239, 68, 68, 0.1);
      color: #f87171;
      font-size: 0.85rem;
      text-align: center;
      border: 1px solid rgba(239, 68, 68, 0.2);
      &.success {
        background: rgba(16, 185, 129, 0.1);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }
    }
    .footer-note {
      border-radius: 1rem;
      opacity: 0.6;
    }
    .w-full { width: 100%; }
    .opacity-50 { opacity: 0.5; }
  `]
})
export class SettingsComponent implements OnInit {
  private authService = inject(AuthService);
  user$ = this.authService.user$;

  displayName = '';
  newPassword = '';
  confirmPassword = '';

  ngOnInit() {
    this.user$.subscribe(user => {
      if (user) {
        this.displayName = user.user_metadata?.['display_name'] || user.email?.split('@')[0] || '';
      }
    });
  }

  loadingProfile = signal(false);
  profileMessage = signal('');
  isProfileSuccess = signal(false);

  loadingSecurity = signal(false);
  securityMessage = signal('');
  isSecuritySuccess = signal(false);

  async updateProfile() {
    if (!this.displayName) return;
    this.loadingProfile.set(true);
    this.profileMessage.set('');
    
    try {
      await this.authService.updateUserProfile(this.displayName);
      this.isProfileSuccess.set(true);
      this.profileMessage.set('Profil berhasil diperbarui!');
    } catch (err: any) {
      this.isProfileSuccess.set(false);
      this.profileMessage.set('Gagal memperbarui profil: ' + err.message);
    } finally {
      this.loadingProfile.set(false);
    }
  }

  async changePassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Konfirmasi password tidak cocok.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Password minimal 6 karakter.');
      return;
    }

    this.loadingSecurity.set(true);
    this.securityMessage.set('');

    try {
      await this.authService.updateUserPassword(this.newPassword);
      this.isSecuritySuccess.set(true);
      this.securityMessage.set('Password berhasil diganti!');
      this.newPassword = '';
      this.confirmPassword = '';
    } catch (err: any) {
      this.isSecuritySuccess.set(false);
      this.securityMessage.set('Gagal ganti password: ' + err.message);
    } finally {
      this.loadingSecurity.set(false);
    }
  }
}
