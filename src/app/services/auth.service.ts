import { Injectable, inject } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, User, updateProfile, updatePassword } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  
  // Observable tracking the current user
  user$: Observable<User | null> = user(this.auth);

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async logout() {
    return signOut(this.auth);
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  async updateUserProfile(displayName: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return updateProfile(user, { displayName });
  }

  async updateUserPassword(newPassword: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('No user logged in');
    return updatePassword(user, newPassword);
  }
}
