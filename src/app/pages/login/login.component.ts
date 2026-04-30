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
      background: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .glow-sphere {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
      top: -200px;
      left: -200px;
    }
    .glow-sphere.secondary {
      top: auto;
      left: auto;
      bottom: -200px;
      right: -200px;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.1) 0%, transparent 70%);
    }
    .login-card {
      width: 400px;
      padding: 3rem;
      z-index: 10;
      text-align: center;
    }
    .brand {
      .logo-hex {
        width: 60px;
        height: 60px;
        background: var(--primary);
        margin: 0 auto 1.5rem;
        clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 1.5rem;
        box-shadow: 0 0 20px var(--primary-glow);
      }
      h2 { letter-spacing: -0.02em; }
    }
    .input-group {
      text-align: left;
      label { display: block; font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-muted); }
      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        .icon { position: absolute; left: 1rem; color: var(--text-muted); }
        input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          padding: 0.85rem 1rem 0.85rem 3rem;
          border-radius: 0.75rem;
          color: white;
          outline: none;
          transition: all 0.2s;
          &:focus { border-color: var(--primary); background: rgba(255,255,255,0.06); }
        }
      }
    }
    .w-full { width: 100%; }
    .error-msg { color: #ef4444; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid rgba(239, 68, 68, 0.2); }
    .text-xs { font-size: 0.7rem; }
    .mb-4 { margin-bottom: 1rem; }
    .btn-link { 
      background: none; border: none; color: var(--primary); font-weight: 600; cursor: pointer; padding: 0.25rem; font-size: 0.8rem;
      &:hover { text-decoration: underline; }
    }
    .toggle-mode { line-height: 1.5; }
    .divider {
      display: flex; align-items: center; gap: 1rem; color: var(--text-muted); font-size: 0.7rem;
      &::before, &::after { content: ''; flex: 1; height: 1px; background: var(--border-color); }
    }
    .btn-google {
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      background: white; color: #1f2937; border: none; padding: 0.75rem; border-radius: 0.75rem;
      font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
      img { width: 18px; }
      &:hover { background: #f3f4f6; transform: translateY(-2px); }
      &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    }
    .mt-6 { margin-top: 1.5rem; }
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
