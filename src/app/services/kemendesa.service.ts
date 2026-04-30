import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

/**
 * Interface untuk data yang diambil dari SID Kemendesa
 */
export interface SidDesaData {
  kode_desa: string;
  nama_desa: string;
  status_idm?: string;      // Contoh: Mandiri, Maju, Berkembang
  skor_idm?: number;
  penduduk?: number;
  kk?: number;
  luas_wilayah?: number;
  dana_desa?: number;
  potensi?: string[];
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class KemendesaService {
  // SID Kemendesa API Base (Commonly used by village portals)
  private readonly SID_API_BASE = 'https://sid.kemendesa.go.id/api';

  constructor(private http: HttpClient) {}

  /**
   * Mengambil Profil Desa dari SID Kemendesa berdasarkan Kode Desa (10 digit)
   * @param villageCode Kode desa tanpa titik (Contoh: 7310022001)
   */
  getVillageProfile(villageCode: string): Observable<any> {
    const cleanCode = villageCode.replace(/\./g, '');
    // Endpoint umum SID untuk profil desa
    return this.http.get(`${this.SID_API_BASE}/desa/details/${cleanCode}`).pipe(
      catchError(err => {
        console.error('Error fetching Kemendesa data:', err);
        return of(null);
      })
    );
  }

  /**
   * Mengambil Indeks Desa Membangun (IDM)
   */
  getVillageIdm(villageCode: string): Observable<any> {
    const cleanCode = villageCode.replace(/\./g, '');
    return this.http.get(`${this.SID_API_BASE}/idm/status/${cleanCode}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Mengambil Ringkasan Statistik Penduduk versi Kemendesa
   */
  getVillageStats(villageCode: string): Observable<any> {
    const cleanCode = villageCode.replace(/\./g, '');
    return this.http.get(`${this.SID_API_BASE}/desa/statistics/${cleanCode}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Helper untuk mencari desa secara nasional (Autocomplete)
   */
  searchVillage(query: string): Observable<any[]> {
    if (query.length < 3) return of([]);
    // Menggunakan endpoint pencarian publik yang stabil
    return this.http.get<any>(`https://wilayah.id/api/search?q=${query}`).pipe(
      map(res => res.data || []),
      catchError(() => of([]))
    );
  }
}
