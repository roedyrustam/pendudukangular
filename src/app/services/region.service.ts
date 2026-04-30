import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

  // Helper for fetching with fallback
  private async fetchWithFallback(primaryUrl: string, fallbackUrl: string): Promise<any> {
    try {
      const res = await fetch(primaryUrl);
      if (!res.ok) throw new Error('Primary API failed');
      const json = await res.json();
      return json.data || json;
    } catch (e) {
      console.warn('Switching to fallback API...', e);
      const res = await fetch(fallbackUrl);
      return await res.json();
    }
  }

  // --- Wilayah API ---

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
    const code = provinceCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/regencies/${provinceCode}.json`,
      `${FALLBACK_API}/regencies/${code}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  async getDistricts(regencyCode: string): Promise<RegionItem[]> {
    const code = regencyCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/districts/${regencyCode}.json`,
      `${FALLBACK_API}/districts/${code}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  async getVillages(districtCode: string): Promise<RegionItem[]> {
    const code = districtCode.replace(/\./g, '');
    return this.fetchWithFallback(
      `${WILAYAH_API}/villages/${districtCode}.json`,
      `${FALLBACK_API}/villages/${code}.json`
    ).then(data => data.map((item: any) => ({ 
      code: item.code || item.id, 
      name: item.name 
    })));
  }

  // --- Village Config CRUD (Supabase) ---

  getVillageConfig(): Observable<VillageConfig | null> {
    return from(
      this.supabase
        .from('village_config')
        .select('*')
        .limit(1)
        .single()
    ).pipe(map(res => res.data as VillageConfig | null));
  }

  async saveVillageConfig(config: VillageConfig) {
    // Upsert — insert or update the single config row
    const payload = {
      ...config,
      updated_at: new Date().toISOString(),
      created_at: config.created_at || new Date().toISOString(),
    };

    if (config.id) {
      return this.supabase
        .from('village_config')
        .update(payload)
        .eq('id', config.id);
    } else {
      return this.supabase
        .from('village_config')
        .insert([payload]);
    }
  }

  async uploadVillageLogo(file: File): Promise<string> {
    const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
    const filePath = `logos/${fileName}`;

    const { data, error } = await this.supabase.storage
      .from('village-logos')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = this.supabase.storage
      .from('village-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  }
}
