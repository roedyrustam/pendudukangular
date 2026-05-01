import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, switchMap, take } from 'rxjs';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Tunggu konfirmasi sesi aktual dari Supabase
  const user = await authService.getCurrentUser();
  
  if (!user) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};
