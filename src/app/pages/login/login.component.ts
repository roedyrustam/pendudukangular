import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
          <h2>DigiWarga</h2>
          <p class="text-muted">Manajemen Kependudukan Terpadu</p>
        </div>

        <form (submit)="onSubmit()" class="mt-8">
          <div class="input-group">
            <label>Email Admin</label>
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
            {{ isLoading() ? 'Mengautentikasi...' : 'Masuk Ke Sistem' }}
          </button>
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
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  isLoading = signal(false);
  errorMessage = signal('');

  async onSubmit() {
    if (!this.email || !this.password) return;
    
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (e: any) {
      console.error(e);
      this.errorMessage.set('Email atau password salah. Silakan coba lagi.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
