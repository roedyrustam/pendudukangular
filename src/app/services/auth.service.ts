import { Injectable, inject } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, signOut, User, updateProfile, updatePassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, docData } from '@angular/fire/firestore';
import { Observable, of, switchMap } from 'rxjs';
import { AppUser } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  
  // Basic Auth User
  user$: Observable<User | null> = user(this.auth);

  // Full App User with Role
  userData$: Observable<AppUser | null> = this.user$.pipe(
    switchMap(u => {
      if (!u) return of(null);
      return docData(doc(this.firestore, 'users', u.uid)) as Observable<AppUser>;
    })
  );

  async login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }

  async getProfile(uid: string): Promise<AppUser | null> {
    const docRef = doc(this.firestore, 'users', uid);
    const userSnap = await getDoc(docRef);
    return userSnap.exists() ? (userSnap.data() as AppUser) : null;
  }

  async register(email: string, password: string, nik?: string) {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.createUserProfile(cred.user, 'warga', nik);
    return cred;
  }

  async createUserProfile(user: User, role: 'admin' | 'petugas' | 'warga', nik?: string) {
    const userRef = doc(this.firestore, 'users', user.uid);
    const appUser: AppUser = {
      uid: user.uid,
      email: user.email,
      role: role,
      nik: nik,
      displayName: user.displayName || '',
      created_at: new Date()
    };
    return setDoc(userRef, appUser);
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
