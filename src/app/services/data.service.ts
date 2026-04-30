import { Injectable, inject, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Family, Resident, ServiceRequest, ResidentDocument, AppUser, UserRole, Article, APBDes } from '../models/data.models';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
  }

  // --- FAMILIES ---
  getFamilies(): Observable<Family[]> {
    return from(
      this.supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as Family[]));
  }

  async addFamily(family: Family) {
    return this.supabase.from('families').insert([{ ...family, created_at: new Date().toISOString() }]);
  }

  async updateFamily(family: Family) {
    return this.supabase
      .from('families')
      .update({ ...family })
      .eq('kk_number', family.kk_number);
  }

  async deleteFamily(kk_number: string) {
    return this.supabase.from('families').delete().eq('kk_number', kk_number);
  }

  // --- RESIDENTS ---
  getResidents(familyId?: string): Observable<Resident[]> {
    let query = this.supabase
      .from('residents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (familyId) {
      query = query.eq('family_id', familyId);
    }
    
    return from(query).pipe(map((res) => res.data as Resident[]));
  }

  async addResident(resident: Resident) {
    return this.supabase.from('residents').insert([{ ...resident, created_at: new Date().toISOString() }]);
  }

  async updateResident(resident: Resident) {
    return this.supabase
      .from('residents')
      .update({ ...resident })
      .eq('nik', resident.nik);
  }

  async deleteResident(nik: string) {
    return this.supabase.from('residents').delete().eq('nik', nik);
  }

  // --- SERVICE REQUESTS ---
  getRequests(): Observable<ServiceRequest[]> {
    return from(
      this.supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as ServiceRequest[]));
  }

  async addRequest(request: ServiceRequest) {
    return this.supabase.from('services').insert([{ ...request, created_at: new Date().toISOString() }]);
  }

  // --- DETAIL FETCHERS ---
  getResident(nik: string): Observable<Resident | undefined> {
    return from(
      this.supabase.from('residents').select('*').eq('nik', nik).single()
    ).pipe(map((res) => res.data as Resident));
  }

  getFamily(kk_number: string): Observable<Family | undefined> {
    return from(
      this.supabase.from('families').select('*').eq('kk_number', kk_number).single()
    ).pipe(map((res) => res.data as Family));
  }

  getResidentRequests(nik: string): Observable<ServiceRequest[]> {
    return from(
      this.supabase
        .from('services')
        .select('*')
        .eq('nik', nik)
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as ServiceRequest[]));
  }

  // --- DOCUMENTS ---
  getResidentDocuments(nik: string): Observable<ResidentDocument[]> {
    return from(
      this.supabase
        .from('residents_docs')
        .select('*')
        .eq('nik', nik)
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as ResidentDocument[]));
  }

  async uploadResidentDocument(nik: string, file: File, type: string, description?: string, is_requirement?: boolean) {
    const filePath = `residents/${nik}/${Date.now()}_${file.name}`;
    
    // Upload file to Supabase Storage
    const uploadRes = await this.supabase.storage
      .from('residents')
      .upload(filePath, file);
    
    const uploadError = uploadRes.error;

    if (uploadError) throw uploadError;

    // Get public URL
    const urlRes = this.supabase.storage
      .from('residents')
      .getPublicUrl(filePath);
    
    const urlData = urlRes.data;

    // Save metadata to Firestore (now Supabase)
    const docData: Omit<ResidentDocument, 'id'> = {
      nik,
      name: file.name,
      url: urlData.publicUrl,
      path: filePath,
      type,
      description: description || '',
      is_requirement: is_requirement || false,
      created_at: new Date().toISOString()
    };
    
    return this.supabase.from('residents_docs').insert([docData]);
  }

  async deleteResidentDocument(docId: string, path: string) {
    // Delete file from storage
    await this.supabase.storage.from('residents').remove([path]);

    // Delete metadata from table
    return this.supabase.from('residents_docs').delete().eq('id', docId);
  }

  async updateRequestStatus(requestId: string, status: string, adminNote: string = '') {
    return this.supabase
      .from('services')
      .update({
        status,
        admin_note: adminNote,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
  }

  // --- USER MANAGEMENT ---
  getUsers(): Observable<AppUser[]> {
    return from(
      this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as AppUser[]));
  }

  async updateUserRole(uid: string, role: UserRole, id_grup?: string | number) {
    return this.supabase
      .from('profiles')
      .update({ role, id_grup, updated_at: new Date().toISOString() })
      .eq('id', uid);
  }

  // --- Multi-Upload & Enhanced Services ---
  
  async uploadFileOnly(file: File, path: string): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('residents')
      .upload(path, file);
    if (error) throw error;
    
    const { data: urlData } = this.supabase.storage
      .from('residents')
      .getPublicUrl(path);
    return urlData.publicUrl;
  }

  async uploadMultipleFiles(files: FileList | File[], basePath: string): Promise<string[]> {
    const urls: string[] = [];
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      const path = `${basePath}/${Date.now()}_${file.name}`;
      const url = await this.uploadFileOnly(file, path);
      urls.push(url);
    }
    return urls;
  }

  async getResidentByNikSync(nik: string): Promise<Resident | null> {
    const res = await this.supabase
      .from('residents')
      .select('*')
      .eq('nik', nik)
      .single();
    return res.data as Resident;
  }

  async updateRequestFull(requestId: string, data: Partial<ServiceRequest>) {
    return this.supabase
      .from('services')
      .update({ ...data, processed_at: new Date().toISOString() })
      .eq('id', requestId);
  }
  
  async getRequestById(requestId: string): Promise<ServiceRequest | null> {
    const res = await this.supabase
      .from('services')
      .select('*')
      .eq('id', requestId)
      .single();
    return res.data as ServiceRequest;
  }

  // --- REALTIME SUBSCRIPTIONS ---
  
  subscribeToRequests(callback: (payload: any) => void) {
    return this.supabase
      .channel('public:services')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, callback)
      .subscribe();
  }

  subscribeToResidents(callback: (payload: any) => void) {
    return this.supabase
      .channel('public:residents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'residents' }, callback)
      .subscribe();
  }

  subscribeToFamilies(callback: (payload: any) => void) {
    return this.supabase
      .channel('public:families')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'families' }, callback)
      .subscribe();
  }

  // --- ARTICLES ---
  getArticles(): Observable<Article[]> {
    return from(
      this.supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(map((res) => res.data as Article[]));
  }

  async addArticle(article: Partial<Article>) {
    return this.supabase.from('articles').insert([article]);
  }

  // --- APBDes ---
  getAPBDes(year?: number): Observable<APBDes[]> {
    let query = this.supabase.from('apbdes').select('*');
    if (year) {
      query = query.eq('year', year);
    }
    return from(query.order('type', { ascending: true })).pipe(map((res) => res.data as APBDes[]));
  }

  async addAPBDes(data: Partial<APBDes>) {
    return this.supabase.from('apbdes').insert([data]);
  }
}
