# 🏢 DigiWarga - Sistem Informasi Kependudukan Digital

**DigiWarga** adalah solusi administrasi kependudukan modern berbasis web yang dirancang untuk mendukung transformasi digital di tingkat Desa/Kelurahan. Dibangun dengan framework **Angular 21** dan **Supabase**, sistem ini menawarkan performa tinggi dengan antarmuka **Cyber-Luxe** yang futuristik dan sinkronisasi data real-time.

---

## ✨ Fitur Utama
- 🔐 **Role Based Access Control (RBAC)**: Akses multi-level (Admin, Petugas, Warga) yang aman via Supabase Auth.
- 🌐 **Portal Warga (Self-Service)**: Pendaftaran mandiri via Google Auth & pelacakan layanan secara real-time.
- 🗺️ **Integrasi Wilayah Nasional**: Sinkronisasi data wilayah (Provinsi s/d Desa) sesuai standar Kemendagri.
- 🏛️ **Village Insights**: Integrasi data profil desa, IDM, dan Dana Desa dari API Kemendesa.
- 📜 **Smart Document Issuance**: Cetak & arsip otomatis Surat Keterangan resmi berformat PDF dengan header dinamis.
- 📂 **Digital Repository**: Unggah dokumen pendukung (KTP/KK) langsung ke Supabase Storage.
- 📊 **Dashboard Analytics**: Visualisasi statistik kependudukan dan progres layanan administratif.

---

## 🚀 Persiapan & Instalasi

### Prasyarat
- [Node.js](https://nodejs.org/) (LTS direkomendasikan)
- [Angular CLI](https://angular.dev/tools/cli)
- Akun [Supabase](https://supabase.com/) (untuk database, auth, & storage)

### Langkah Instalasi
1. **Clone Repository**
   ```bash
   git clone <url-repository>
   cd pendudukangular
   ```

2. **Install Dependensi**
   ```bash
   npm install
   ```

3. **Konfigurasi Supabase**
   Buka file `src/environments/environment.ts` dan masukkan kredensial proyek Supabase Anda:
   ```typescript
   export const environment = {
     supabase: {
       url: "https://your-project.supabase.co",
       key: "your-anon-key"
     }
   };
   ```

4. **Jalankan Server Lokal**
   ```bash
   npm run dev
   ```
   Buka `http://localhost:4200` di browser Anda.

---

## 🛠️ Arsitektur Proyek
- **Frontend**: Angular 21 (Signals-based reactivity & Standalone Components).
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime).
- **External APIs**: Wilayah.id (Kemendagri) & SID (Kemendesa).
- **Reporting**: jsPDF & autoTable.
- **Design System**: "Cyber-Luxe" (Custom CSS, Glassmorphism, Neon Accents).

Untuk detail arsitektur teknis lebih mendalam, silakan buka: [BLUEPRINT.md](./BLUEPRINT.md)

---

## 📋 Dokumentasi Lanjutan
- **Product Requirements (PRD)**: [PRD.md](./PRD.md)
- **Technical Blueprint**: [BLUEPRINT.md](./BLUEPRINT.md)

---

## 🤝 Kontribusi
Kontribusi dan saran fitur baru sangat disambut untuk meningkatkan kualitas layanan kependudukan digital di Indonesia.

---
© 2026 **Pandu Talenta Digital** | Made with ❤️ for DigiWarga.

---
**Fullstack By Roedy Rustan**
