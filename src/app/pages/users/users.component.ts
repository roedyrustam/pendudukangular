import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AppUser, UserRole } from '../../models/data.models';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="users-page fade-in">
      <header class="page-header">
        <div>
          <h1 class="title-gradient">Manajemen User</h1>
          <p class="tagline">Kelola hak akses dan peran pengguna sistem</p>
        </div>
      </header>

      <div class="user-list card-luxury glass-panel mt-6">
        <table class="luxury-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>NIK (Warga)</th>
              <th>Role</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users$ | async">
              <td>
                <div class="user-meta">
                  <span class="avatar">👤</span>
                  <span>{{ user.displayName || 'Akun Baru' }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>{{ user.nik || '-' }}</td>
              <td>
                <span class="badge" [class]="user.role">
                  {{ user.role | uppercase }}
                </span>
              </td>
              <td>
                <div class="role-actions">
                  <button (click)="updateRole(user.id, 'admin')" 
                    class="btn-icon" title="Promote to Admin"
                    [class.active]="user.role === 'admin'">🛡️</button>
                  <button (click)="updateRole(user.id, 'petugas')" 
                    class="btn-icon" title="Set as Petugas"
                    [class.active]="user.role === 'petugas'">💼</button>
                  <button (click)="updateRole(user.id, 'warga')" 
                    class="btn-icon" title="Set as Warga"
                    [class.active]="user.role === 'warga'">🏠</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .users-page { padding: 2rem; }
    .luxury-table {
      width: 100%;
      border-collapse: collapse;
      th { text-align: left; padding: 1.25rem; color: var(--text-muted); font-size: 0.8rem; font-weight: 600; border-bottom: 1px solid var(--border-color); }
      td { padding: 1.25rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    }
    .user-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      .avatar { width: 32px; height: 32px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; border-radius: 50%; }
    }
    .badge {
      padding: 0.25rem 0.6rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 700;
      &.admin { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
      &.petugas { background: rgba(99, 102, 241, 0.1); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.2); }
      &.warga { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    }
    .role-actions {
      display: flex;
      gap: 0.5rem;
      .btn-icon {
        background: rgba(255,255,255,0.05);
        border: 1px solid var(--border-color);
        width: 32px;
        height: 32px;
        border-radius: 0.5rem;
        cursor: pointer;
        transition: all 0.2s;
        filter: grayscale(1);
        opacity: 0.5;
        &:hover { background: rgba(255,255,255,0.1); opacity: 1; }
        &.active { filter: grayscale(0); opacity: 1; border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
      }
    }
  `]
})
export class UsersComponent {
  private dataService = inject(DataService);
  users$: Observable<AppUser[]> = this.dataService.getUsers();

  async updateRole(uid: string, role: string) {
    try {
      await this.dataService.updateUserRole(uid, role as UserRole);
    } catch (e) {
      console.error('Error updating role:', e);
      alert('Gagal mengupdate role. Pastikan Anda memiliki hak akses Admin.');
    }
  }
}
