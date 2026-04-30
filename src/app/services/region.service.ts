import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { RegionItem, VillageConfig } from '../models/data.models';
import { Observable, from, map } from 'rxjs';

const WILAYAH_API = 'https://wilayah.id/api';

@Injectable({
  providedIn: 'root',
})
export class RegionService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.key);
  }

  // --- Wilayah API (Kemendagri via wilayah.id) ---

  async getProvinces(): Promise<RegionItem[]> {
    const res = await fetch(`${WILAYAH_API}/provinces.json`);
    const json = await res.json();
    return json.data as RegionItem[];
  }

  async getRegencies(provinceCode: string): Promise<RegionItem[]> {
    const res = await fetch(`${WILAYAH_API}/regencies/${provinceCode}.json`);
    const json = await res.json();
    return json.data as RegionItem[];
  }

  async getDistricts(regencyCode: string): Promise<RegionItem[]> {
    const code = regencyCode.replace('.', '');
    const res = await fetch(`${WILAYAH_API}/districts/${code}.json`);
    const json = await res.json();
    return json.data as RegionItem[];
  }

  async getVillages(districtCode: string): Promise<RegionItem[]> {
    const code = districtCode.replace(/\./g, '');
    const res = await fetch(`${WILAYAH_API}/villages/${code}.json`);
    const json = await res.json();
    return json.data as RegionItem[];
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
}
