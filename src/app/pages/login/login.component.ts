import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="glow-sphere"></div>
      <div class="glow-sphere secondary"></div>
      
      <div class="login-card card-luxury glass-panel fade-in">
        <div class="brand">
          <div class="logo-hex">DW</div>
          <h2>{{ isRegistering() ? 'Daftar Warga' : isCompletingProfile() ? 'Lengkapi Profil' : 'DigiWarga' }}</h2>
          <p class="text-muted">{{ isRegistering() ? 'Buat akun untuk akses mandiri' : isCompletingProfile() ? 'Masukkan NIK untuk akses sistem' : 'Manajemen Kependudukan Terpadu' }}</p>
        </div>

        <form (submit)="onSubmit()" class="mt-8">
          <!-- Complete Profile Mode (Google New User) -->
          <div *ngIf="isCompletingProfile()" class="input-group mb-4 fade-in">
            <label>NIK (16 Digit)</label>
            <div class="input-wrapper">
              <span class="icon">🆔</span>
              <input type="text" [(ngModel)]="nik" name="p_nik" placeholder="Masukkan NIK valid Anda" required>
            </div>
            <button type="button" (click)="finishGoogleProfile()" class="btn-primary w-full mt-6" [disabled]="isLoading() || !nik">
              {{ isLoading() ? 'Menyimpan...' : 'Selesaikan Pendaftaran' }}
            </button>
          </div>

          <!-- Normal Login/Register Mode -->
          <ng-container *ngIf="!isCompletingProfile()">
            <div *ngIf="isRegistering()" class="input-group mb-4">
              <label>NIK (Must be valid in system)</label>
              <div class="input-wrapper">
                <span class="icon">🆔</span>
                <input type="text" [(ngModel)]="nik" name="nik" placeholder="16 digit NIK" required>
              </div>
            </div>

            <div class="input-group">
            <label>Email Address</label>
            <div class="input-wrapper">
              <span class="icon">📧</span>
              <input type="email" [(ngModel)]="email" name="email" placeholder="admin@digiwarga.id" required>
            </div>
          </div>

          <div class="input-group mt-4">
            <label>Password</label>
            <div class="input-wrapper">
              <span class="icon">🔒</span>
              <input type="password" [(ngModel)]="password" name="password" placeholder="••••••••" required>
            </div>
          </div>

          <p *ngIf="errorMessage()" class="error-msg mt-4">{{ errorMessage() }}</p>


            <button type="submit" class="btn-primary w-full mt-8" [disabled]="isLoading()">
              {{ isLoading() ? 'Memproses...' : (isRegistering() ? 'Daftar Sekarang' : 'Masuk Ke Sistem') }}
            </button>

            <div class="divider mt-6" *ngIf="!isRegistering()">
              <span>OR</span>
            </div>

            <button type="button" (click)="onGoogleLogin()" *ngIf="!isRegistering()" class="btn-google w-full mt-4" [disabled]="isLoading()">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G">
              {{ isLoading() ? 'Menghubungkan...' : 'Masuk dengan Google' }}
            </button>

            <div class="toggle-mode mt-6">
              <p class="text-xs text-muted">
                {{ isRegistering() ? 'Sudah punya akun?' : 'Warga baru?' }}
                <br>
                <button type="button" class="btn-link" (click)="toggleMode()">
                  {{ isRegistering() ? 'Klik di sini untuk Masuk' : 'Daftar akun Warga di sini' }}
                </button>
              </p>
            </div>
          </ng-container>
        </form>

        <div class="footer mt-6">
          <p class="text-xs text-muted">© 2026 DigiWarga. All rights reserved.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .glow-sphere {
      position: absolute;
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%);
      top: -300px;
      left: -300px;
    }
    .glow-sphere.secondary {
      top: auto;
      left: auto;
      bottom: -300px;
      right: -300px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%);
    }
    .login-card {
      width: 420px;
      padding: 3.5rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
      border-radius: 2rem;
      z-index: 10;
      text-align: center;
    }
    .brand {
      .logo-hex {
        width: 64px;
        height: 64px;
        background: #000000;
        color: white;
        margin: 0 auto 1.5rem;
        clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.5rem;
      }
      h2 { 
        color: #000000; 
        font-weight: 800; 
        font-size: 1.75rem;
        letter-spacing: -0.02em; 
      }
      p { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }
    }
    .input-group {
      text-align: left;
      label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.5rem; color: #000000; }
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        .icon { position: absolute; left: 1.25rem; font-size: 1rem; }
        input {
          width: 100%;
          background: #f1f5f9;
          border: 2px solid transparent;
          padding: 1rem 1rem 1rem 3.5rem;
          border-radius: 1rem;
          color: #000000;
          font-weight: 500;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          &::placeholder { color: #94a3b8; }
          &:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
        }
      }
    }
    .btn-primary {
      background: #000000;
      color: white;
      border: none;
      padding: 1.15rem;
      border-radius: 1rem;
      font-weight: 700;
      font-size: 1rem;
      width: 100%;
      cursor: pointer;
      transition: all 0.2s;
      &:hover { background: #1a1a1a; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }
    .btn-google {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      background: white; color: #000000; border: 2px solid #e2e8f0; padding: 1.15rem; border-radius: 1rem;
      font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s;
      width: 100%;
      img { width: 22px; }
      &:hover { border-color: #2563eb; background: #f8fafc; transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.1); }
    }
    .divider {
      display: flex; align-items: center; gap: 1rem; color: #94a3b8; font-size: 0.75rem; font-weight: 700;
      &::before, &::after { content: ''; flex: 1; height: 2px; background: #f1f5f9; }
    }
    .toggle-mode { 
      margin-top: 2rem; 
      p { color: #64748b; font-weight: 500; font-size: 0.85rem; }
      .btn-link { 
        background: none; border: none; color: #2563eb; font-weight: 700; cursor: pointer; padding: 0.5rem; font-size: 0.9rem;
        &:hover { text-decoration: underline; color: #1d4ed8; }
      }
    }
    .error-msg { 
      color: #dc2626; font-size: 0.85rem; font-weight: 600; background: #fef2f2; 
      padding: 1rem; border-radius: 1rem; border: 1px solid #fee2e2; margin-bottom: 1.5rem;
    }
    .footer { p { color: #94a3b8; font-weight: 500; font-size: 0.75rem; } }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.authService.user$.pipe(take(1)).subscribe(async user => {
      if (user) {
        const profile = await this.authService.getProfile(user.id);
        if (!profile) {
          this.isCompletingProfile.set(true);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  email = '';
  password = '';
  nik = '';
  isLoading = signal(false);
  isRegistering = signal(false);
  isCompletingProfile = signal(false);
  errorMessage = signal('');

  toggleMode() {
    this.isRegistering.update(v => !v);
    this.isCompletingProfile.set(false);
    this.errorMessage.set('');
  }

  async onGoogleLogin() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    try {
      await this.authService.loginWithGoogle();
      // Redirect happens here, so no need for profile check here
    } catch (e: any) {
      console.error(e);
      this.errorMessage.set('Gagal masuk dengan Google. Silakan coba lagi.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async finishGoogleProfile() {
    if (!this.nik) return;
    const user = await this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading.set(true);
    try {
      await this.authService.createUserProfile(user as any, 'warga', this.nik);
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error(e);
      this.errorMessage.set('Gagal melengkapi profil. Pastikan NIK benar.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async onSubmit() {
    if (!this.email || !this.password) return;
    if (this.isRegistering() && !this.nik) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      if (this.isRegistering()) {
        await this.authService.register(this.email, this.password, this.nik);
      } else {
        await this.authService.login(this.email, this.password);
      }
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      console.error(e);
      this.errorMessage.set('Email atau password salah. Silakan coba lagi.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
