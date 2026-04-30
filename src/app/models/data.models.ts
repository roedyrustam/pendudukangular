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
  id: string; // id
  nik: string; // id_pemohon (NIK)
  service_type: string; // nama surat
  id_surat?: string; // id_surat dari tweb_surat_format
  reason: string; // keperluan / isian_form
  form_data?: string; // isian_form (JSON)
  status: 'Pending' | 'Diproses' | 'Selesai' | 'Ditolak'; // status (0, 1, 2, 3)
  admin_note?: string; // keterangan
  attachments?: string[]; // syarat
  letter_url?: string; // url file surat (jika sudah dicetak)
  phone_active?: string; // no_hp_aktif
  processed_by?: string;
  processed_at?: string;
  updated_at?: string; // updated_at
  created_at: string; // created_at
}

export type UserRole = 'admin' | 'petugas' | 'warga';

export interface AppUser {
  id: string; // id
  email: string | null; // email / username
  role: UserRole; // id_grup (1=admin, 2=petugas, 5=warga)
  id_grup?: string | number; // id_grup dari OpenSID
  nik?: string; // Only for warga
  phone?: string; // phone
  displayName?: string; // nama
  photoURL?: string; // foto
  last_login?: string; // last_login
  created_at: string;
}

export interface ResidentDocument {
  id: string; // id
  nik: string; // id_pend / nik
  name: string; // nama
  url: string; // tautan unduhan publik
  path: string; // satuan / path file (di OpenSID ini bisa berisi nama file)
  type: string; // mime type atau jenis (contoh: KTP, KK)
  description?: string; // keterangan
  is_requirement?: boolean; // syarat_surat (apakah dokumen ini syarat permohonan)
  created_at: string; // tgl_upload
}
