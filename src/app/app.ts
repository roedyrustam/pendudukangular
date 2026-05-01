import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(AuthService);
  protected readonly title = signal('digiwarga');
  private router = inject(Router);

  searchQuery = signal('');

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  handleSearch(event: any) {
    const q = event.target.value;
    this.searchQuery.set(q);
    if (q.length >= 10) { // Likely NIK or KK
       if (q.startsWith('3') || q.length === 16) {
          // Navigate to resident or family
          this.router.navigate(['/residents'], { queryParams: { q } });
       }
    }
  }
}
