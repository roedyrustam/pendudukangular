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
