import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { RegionItem, VillageConfig } from '../models/data.models';
import { Observable, from, map } from 'rxjs';

const WILAYAH_API = 'https://wilayah.id/api';
const FALLBACK_API = 'https://www.emsifa.com/api-indonesia/api';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
  }

  private async fetchWithFallback(primaryUrl: string, fallbackUrl: string): Promise<any> {
    try {
      const res = await fetch(primaryUrl);
      if (!res.ok) throw new Error('Primary API failed');
      const json = await res.json();
      // Handle wilayah.id structure { data: [...] } or direct array
      return json.data || json;
    } catch (e) {
      console.warn('Switching to fallback API...', e);
      const res = await fetch(fallbackUrl);
      return await res.json();
    }
  }

  async getProvinces(): Promise<RegionItem[]> {
    return this.fetchWithFallback(
      `${WILAYAH_API}/provinces.json`,
      `${FALLBACK_API}/provinces.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  async getRegencies(provinceCode: string): Promise<RegionItem[]> {
    // Format code for API (remove dots for fallback)
    const cleanCode = provinceCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/regencies/${provinceCode}.json`,
      `${FALLBACK_API}/regencies/${cleanCode}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  async getDistricts(regencyCode: string): Promise<RegionItem[]> {
    const cleanCode = regencyCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/districts/${regencyCode}.json`,
      `${FALLBACK_API}/districts/${cleanCode}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  async getVillages(districtCode: string): Promise<RegionItem[]> {
    const cleanCode = districtCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/villages/${districtCode}.json`,
      `${FALLBACK_API}/villages/${cleanCode}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  getVillageConfig(): Observable<VillageConfig | null> {
    return from(
      this.supabase
        .from('village_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    ).pipe(
      map(res => res.data as VillageConfig)
    );
  }

  async saveVillageConfig(config: VillageConfig) {
    const { id, ...payload } = config;
    if (id) {
      const { error } = await this.supabase
        .from('village_config')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await this.supabase
        .from('village_config')
        .insert([payload]);
      if (error) throw error;
    }
  }

  async uploadVillageLogo(file: File): Promise<string> {
    const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `logos/${fileName}`;
    const { error } = await this.supabase.storage
      .from('village-logos')
      .upload(filePath, file);
    if (error) throw error;
    const { data: { publicUrl } } = this.supabase.storage
      .from('village-logos')
      .getPublicUrl(filePath);
    return publicUrl;
  }
}
