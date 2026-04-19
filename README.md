# 🏢 DigiWarga - Sistem Informasi Kependudukan Digital

**DigiWarga** adalah solusi administrasi kependudukan modern berbasis web yang dirancang untuk mendukung transformasi digital di tingkat Desa/Kelurahan. Dibangun dengan framework **Angular 21** dan **Firebase**, sistem ini menawarkan performa tinggi dengan antarmuka **Cyber-Luxe** yang futuristik.

---

## ✨ Fitur Utama
- 🔐 **Role Based Access Control (RBAC)**: Akses multi-level (Admin, Petugas, Warga) yang aman.
- 🌐 **Portal Warga (Self-Service)**: Pendaftaran mandiri via Google Auth & pelacakan layanan.
- 📜 **Smart Document Issuance**: Cetak & arsip otomatis Surat Keterangan / Pengantar resmi berformat PDF.
- 📂 **Digital Document Repository**: Unggah dokumen pendukung mandiri (KTP/KK) langsung ke cloud.
- 📊 **Dashboard Analytics**: Visualisasi statistik kependudukan real-time.
- 👥 **Manajemen Penduduk**: Database NIK terpadu dengan pencarian & filter canggih.
- 🏡 **Sistem Keluarga**: Pengelolaan Kartu Keluarga (KK) dengan tracking anggota otomatis.

---

## 🚀 Persiapan & Instalasi

### Prasyarat
- [Node.js](https://nodejs.org/) (versi terbaru direkomendasikan)
- [Angular CLI](https://angular.dev/tools/cli)
- Akun Firebase (untuk database & storage)

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

3. **Konfigurasi Firebase**
   Buka file `src/environments/environment.ts` dan masukkan kredensial proyek Firebase Anda:
   ```typescript
   export const environment = {
     firebase: {
       apiKey: "...",
       authDomain: "...",
       projectId: "...",
       storageBucket: "...",
       messagingSenderId: "...",
       appId: "..."
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
- **Frontend**: Angular 21 (Standalone Components & Signals).
- **Backend (BaaS)**: Firebase (Firestore, Auth, Storage).
- **Library PDF**: jsPDF & html2canvas.
- **Styling**: Modern CSS with Glassmorphism principles.

Untuk detail arsitektur teknis lebih mendalam, silakan buka: [BLUEPRINT.md](./BLUEPRINT.md)

---

## 📋 Dokumentasi Lanjutan
- **Product Requirements (PRD)**: [PRD.md](./PRD.md)
- **Technical Blueprint**: [BLUEPRINT.md](./BLUEPRINT.md)

---

## 🤝 Kontribusi
Aplikasi ini dikembangkan untuk **Desa Contoh**. Kontribusi dan saran fitur baru sangat disambut untuk meningkatkan kualitas layanan kependudukan digital.

---
© 2026 **Pandu Talenta Digital** | Made with ❤️ for DigiWarga.

---
**Fullstack By Roedy Rustan**
