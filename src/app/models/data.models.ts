export interface Family {
  kk_number: string; // no_kk
  head_of_family_nik?: string; // nik_kepala
  head_of_family_name: string; // usually joined with tweb_penduduk or stored directly
  address: string; // alamat
  rt_rw: string; // combining rt / rw
  rt?: string; // rt
  rw?: string; // rw
  hamlet?: string; // dusun
  district: string; // kecamatan
  regency: string; // kabupaten
  province: string; // provinsi
  social_class?: string; // kelas_sosial
  print_date?: string; // tgl_cetak_kk
  created_at: string; // tgl_daftar
}

export interface Resident {
  nik: string;
  family_id: string; // id_kk / no_kk
  full_name: string; // nama
  birth_place: string; // tempatlahir
  birth_date: string; // tanggallahir
  gender: 'Laki-laki' | 'Perempuan'; // sex
  occupation: string; // pekerjaan_id
  relationship: string; // kk_level
  phone?: string; // telepon
  religion?: string; // agama_id
  education?: string; // pendidikan_kk_id
  marital_status?: string; // status_kawin
  blood_type?: string; // golongan_darah_id
  citizenship?: string; // warga_negara_id
  father_name?: string; // nama_ayah
  mother_name?: string; // nama_ibu
  address?: string; // alamat_sekarang
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  nik: string;
  service_type: string;
  reason: string;
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Ditolak';
  admin_note?: string;
  attachments?: string[];
  letter_url?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
}

export type UserRole = 'admin' | 'petugas' | 'warga';

export interface AppUser {
  id: string;
  email: string | null;
  role: UserRole;
  nik?: string; // Only for warga
  phone?: string;
  displayName?: string;
  photoURL?: string;
  created_at: string;
}

export interface ResidentDocument {
  id: string;
  nik: string;
  name: string;
  url: string;
  path: string;
  type: string;
  created_at: string;
}
