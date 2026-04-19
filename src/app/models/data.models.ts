export interface Family {
  id?: string;
  kk_number: string;
  head_of_family_name: string;
  address: string;
  rt_rw: string;
  district: string;
  regency: string;
  province: string;
  created_at: any;
}

export interface Resident {
  id?: string;
  nik: string;
  family_id: string;
  full_name: string;
  birth_place: string;
  birth_date: string;
  gender: 'Laki-laki' | 'Perempuan';
  occupation: string;
  relationship: string;
  created_at: any;
}

export interface ServiceRequest {
  id?: string;
  nik: string;
  service_type: string;
  reason: string;
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Ditolak';
  admin_note?: string;
  attachments?: string[];
  letter_url?: string;
  processed_by?: string;
  processed_at?: any;
  created_at: any;
}

export type UserRole = 'admin' | 'petugas' | 'warga';

export interface AppUser {
  uid: string;
  email: string | null;
  role: UserRole;
  nik?: string; // Only for warga
  displayName?: string;
  photoURL?: string;
  created_at: any;
}

export interface ResidentDocument {
  id?: string;
  nik: string;
  name: string;
  url: string;
  path: string;
  type: string;
  created_at: any;
}
