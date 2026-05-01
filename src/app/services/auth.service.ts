import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Observable, from, map, of, BehaviorSubject, switchMap } from 'rxjs';
import { AppUser } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private authState = new BehaviorSubject<User | null>(null);

  user$ = this.authState.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
    
    // Initialize auth state
    this.supabase.auth.getUser().then((res) => {
      this.authState.next(res.data.user);
    });

    // Listen for changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.authState.next(session?.user ?? null);
    });
  }

  // Full App User with Role
  userData$: Observable<AppUser | null> = this.user$.pipe(
    switchMap(u => {
      if (!u) return of(null);
      return from(this.getProfile(u.id));
    })
  );

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async loginWithGoogle() {
    return this.supabase.auth.signInWithOAuth({ provider: 'google' });
  }

  async getProfile(uid: string): Promise<AppUser | null> {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    return data as AppUser;
  }

  async register(email: string, password: string, nik?: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await this.createUserProfile(data.user, 'warga', nik);
    }
    return data;
  }

  async createUserProfile(user: User, role: 'admin' | 'petugas' | 'warga', nik?: string) {
    const appUser = {
      id: user.id,
      email: user.email,
      role: role,
      nik: nik,
      created_at: new Date().toISOString()
    };
    return this.supabase.from('profiles').insert([appUser]);
  }

  async logout() {
    return this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    const res = await this.supabase.auth.getUser();
    return res.data.user;
  }

  async updateUserProfile(displayName: string) {
    return this.supabase.auth.updateUser({ data: { display_name: displayName } });
  }

  async updateUserPassword(newPassword: string) {
    return this.supabase.auth.updateUser({ password: newPassword });
  }
}
