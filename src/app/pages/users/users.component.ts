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
    .users-page { padding: 1.5rem 0; }
    .luxury-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      th { 
        text-align: left; padding: 1.5rem; 
        color: #000000; font-size: 0.8rem; font-weight: 800; 
        text-transform: uppercase; letter-spacing: 0.1em; 
        border-bottom: 2px solid #f1f5f9; background: #f8fafc; 
      }
      td { padding: 1.5rem; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #000000; }
    }
    .user-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-weight: 700;
      .avatar { 
        width: 40px; height: 40px; background: #f1f5f9; 
        display: flex; align-items: center; justify-content: center; 
        border-radius: 1rem; font-size: 1.2rem;
        border: 1px solid #e2e8f0;
      }
    }
    .badge {
      padding: 0.4rem 0.85rem;
      border-radius: 2rem;
      font-size: 0.7rem;
      font-weight: 800;
      &.admin { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
      &.petugas { background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; }
      &.warga { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    }
    .role-actions {
      display: flex;
      gap: 0.75rem;
      .btn-icon {
        background: #f1f5f9;
        border: 2px solid transparent;
        width: 38px;
        height: 38px;
        border-radius: 0.85rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover { background: #e2e8f0; transform: scale(1.1); }
        &.active { 
          background: white; 
          border-color: #2563eb; 
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); 
        }
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
