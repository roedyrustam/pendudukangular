# Technical Blueprint - DigiWarga

**System Name:** DigiWarga  
**Architecture Style:** Serverless Single Page Application (SPA)  
**Version:** 1.0.0

---

## 1. Technology Stack
- **Framework**: Angular 21 (Signals-based architecture)
- **Language**: TypeScript 5.x
- **Backend / Database**: Google Firebase Cloud Firestore
- **Authentication**: Firebase Authentication (Email/Password)
- **Storage**: Firebase Cloud Storage
- **Reporting**: jsPDF, html2canvas, autoTable
- **Build Tool**: Vite

## 2. Infrastructure Architecture
```mermaid
graph TD
    User((User Admin)) --> SPA[Angular SPA]
    SPA --> Auth[Firebase Auth]
    SPA --> FS[Cloud Firestore]
    SPA --> ST[Cloud Storage]
    SPA --> PDF[Client-side PDF Engine]
```

## 3. Data Architecture (Firestore)

### Collection: `residents`
Menyimpan data individu penduduk.
- `nik` (string, doc_id): Nomor Induk Kependudukan
- `full_name` (string): Nama Lengkap
- `family_id` (string): FK ke collection families (kk_number)
- `birth_place` (string)
- `birth_date` (string)
- `gender` (enum: Laki-laki, Perempuan)
- `occupation` (string)
- `relationship` (string)
- `created_at` (timestamp)

### Collection: `families`
Menyimpan data Kartu Keluarga.
- `kk_number` (string, doc_id)
- `head_of_family_name` (string)
- `address` (string)
- `rt_rw` (string)
- `district` (string)
- `regency` (string)
- `province` (string)
- `created_at` (timestamp)

### Collection: `services`
Riwayat pengajuan administratif.
- `nik` (string): FK ke residents
- `service_type` (string)
- `reason` (string)
- `status` (enum: Pending, Diproses, Selesai, Ditolak)
- `created_at` (timestamp)

### Collection: `residents_docs`
Metadata berkas yang diupload.
- `nik` (string): FK ke residents
- `name` (string): Nama file asli
- `url` (string): URL download publik dari Storage
- `path` (string): Path internal di Storage
- `type` (enum: Image, PDF)
- `created_at` (timestamp)

## 4. UI/UX Design System: "Cyber-Luxe"
Sistem ini menggunakan kustomisasi CSS murni dengan prinsip:
- **Base Colors**: 
  - Background: Darkness (#050505)
  - Primary: Cyan Neon / Indigo Primary
  - Surface: Glassmorphism (semi-transparent blur)
- **Shadows**: Cyber-glow effect menggunakan `box-shadow` neon.
- **Typography**: Optimized Sans-serif (Inter/Seogoe UI) untuk keterbacaan tinggi.

## 5. Security Strategy
Keamanan diatur melalui **Firebase Security Rules**:
- **Authentication**: Hanya user terautentikasi yang dapat melakukan operasi Write.
- **Privacy**: Validasi struktur data di tingkat database untuk mencegah injeksi data sampah.
- **Storage Rules**: Folder storage dipisah per NIK (`residents/{nik}/...`) untuk organisasi yang rapi.

## 6. Project Structure
```text
src/
├── app/
│   ├── models/        # TypeScript Interfaces
│   ├── services/      # Business Logic (Data, Auth, Pdf)
│   ├── pages/         # View Components
│   └── app.routes.ts  # Navigation Mapping
├── environments/      # Firebase Configuration
└── styles.scss        # Global Design Tokens
```

---
**Develop By : Pandu Talenta Digital | Fullstack By Roedy Rustan**
