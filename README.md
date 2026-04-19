# 🏢 DigiWarga - Sistem Informasi Kependudukan Digital

**DigiWarga** adalah solusi administrasi kependudukan modern berbasis web yang dirancang untuk mendukung transformasi digital di tingkat Desa/Kelurahan. Dibangun dengan framework **Angular 21** dan **Firebase**, sistem ini menawarkan performa tinggi dengan antarmuka **Cyber-Luxe** yang futuristik.

---

## ✨ Fitur Utama
- 📊 **Dashboard Analytics**: Visualisasi statistik kependudukan real-time.
- 👥 **Manajemen Penduduk**: Database NIK terpadu dengan pencarian & filter canggih.
- 🏡 **Sistem Keluarga**: Pengelolaan Kartu Keluarga (KK) dengan tracking anggota otomatis.
- 📂 **Digital Document Repository**: Unggah dan kelola berkas KTP/KK langsung di cloud.
- 📄 **Smart Reporting**: Cetak Biodata dan Laporan kolektif dalam format PDF profesional.
- 🔐 **Secure Access**: Proteksi data menggunakan Firebase Authentication.

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
© 2026 **Antigravity AI** | Made with ❤️ for DigiWarga.

---
**Develop By : Pandu Talenta Digital | Fullstack By Roedy Rustan**
