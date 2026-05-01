# Product Requirements Document (PRD) - DigiWarga

**Project Name:** DigiWarga (Sistem Informasi Kependudukan Digital)  
**Client:** Desa/Kelurahan Indonesia  
**Status:** Version 2.0 (Royal Azure Edition - Daylight Premium)  
**Author:** Pandu Talenta Digital

---

## 1. Executive Summary
DigiWarga adalah platform manajemen kependudukan modern yang dirancang untuk mengotomatisasi administrasi tingkat Desa/Kelurahan. Memanfaatkan ekosistem Angular 21 (Signals) dan Supabase, platform ini menghadirkan pengalaman administratif "Daylight Premium" yang fokus pada kecepatan data, akurasi algoritma bantuan sosial, dan desain profesional standar macOS.

## 2. Problem Statement
- **Fragmentasi Data**: Data kependudukan sering tidak sinkron dengan standar nasional.
- **Keterbacaan Rendah**: UI administrasi lama seringkali melelahkan mata dan sulit dibaca di tablet.
- **Subjektivitas Bantuan**: Penentuan penerima bansos seringkali manual dan rentan subjektivitas.
- **Transparansi**: Sulitnya melacak status pengajuan surat oleh warga secara mandiri.

## 3. Goals & Objectives
- **Akurasi Data**: Validasi NIK 16-digit dan sinkronisasi wilayah Kemendagri secara real-time.
- **Otomasi Analisis**: Implementasi algoritma skoring untuk rekomendasi bantuan sosial (Bansos).
- **Estetika High-Trust**: Menghadirkan UI yang memberikan rasa aman dan profesional kepada operator.
- **Otomasi Dokumen**: Generasi PDF Surat Keterangan otomatis dengan header dinamis berbasis konfigurasi desa.

## 4. Target User
- **Administrator Desa**: Operator utama untuk manajemen warga, surat, dan analisis bansos.
- **Kepala Desa/Lurah**: Pengambil keputusan yang memantau dashboard statistik dan hasil analisis.
- **Warga Desa**: Pengguna mandiri yang mengajukan layanan administrasi online.

## 5. Functional Requirements (Current)

### Core Modules
| ID | Feature | Description |
|---|---|---|
| F01 | **Supabase Auth** | Autentikasi aman dengan Role-Based Access Control (RBAC). |
| F02 | **Regional Sync** | Auto-complete data wilayah menggunakan API wilayah.id & Fallback system. |
| F03 | **Population Management**| CRUD Penduduk dengan validasi tipe data PostgreSQL. |
| F04 | **Family Management** | Relasi one-to-many antara Kartu Keluarga dan Anggota Keluarga. |
| F05 | **Realtime Tracking** | Notifikasi status pengajuan layanan secara instan via Supabase Realtime. |
| F06 | **Document Archive** | Penyimpanan berkas digital (KTP/KK) di Supabase Storage. |
| F07 | **Smart Letter Engine** | Generasi PDF Surat Keterangan otomatis dengan header dinamis. |
| F08 | **Village Dashboard** | Statistik kependudukan & data finansial desa (Dana Desa/IDM). |
| F09 | **Bansos Analysis** | Algoritma klasifikasi kelayakan bantuan berdasarkan ekonomi & tanggungan. |

## 6. Non-Functional Requirements
- **Performance**: High-speed reactivity menggunakan Angular Signals.
- **UX Aesthetics**: Desain "Royal Azure & Silk Slate" (Light Mode) dengan sistem spasi 8px.
- **Legibility**: Tipografi hitam pekat (#000000) untuk meminimalkan kelelahan mata operator.
- **Resilience**: Mekanisme fallback API wilayah untuk menjamin uptime 100%.

## 7. Feature Roadmap
- **Next Phase**: Integrasi WhatsApp API untuk notifikasi otomatis pengajuan surat.
- **Future**: Modul GIS (Geographic Information System) untuk pemetaan lokasi warga per RT/RW.
- **Security**: Implementasi MFA (Multi-Factor Authentication) untuk akun Administrator.

---
**Developed By : Pandu Talenta Digital | Implementation By Antigravity AI**
