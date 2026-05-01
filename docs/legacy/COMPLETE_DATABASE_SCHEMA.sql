-- SIDEPE 2025 - COMPLETE DATABASE SCHEMA
-- Generated at: 2026-04-30 17:56:37

SET FOREIGN_KEY_CHECKS = 0;

-- Table: agenda
CREATE TABLE `agenda` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_artikel` int NOT NULL,
  `tgl_agenda` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `koordinator_kegiatan` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `lokasi_kegiatan` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_artikel` (`id_artikel`),
  CONSTRAINT `agenda_fk1` FOREIGN KEY (`id_artikel`) REFERENCES `artikel` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: analisis_indikator
CREATE TABLE `analisis_indikator` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_master` int NOT NULL,
  `nomor` int NOT NULL,
  `pertanyaan` varchar(400) NOT NULL,
  `id_tipe` tinyint NOT NULL DEFAULT '1',
  `bobot` tinyint NOT NULL DEFAULT '0',
  `act_analisis` tinyint(1) NOT NULL DEFAULT '2',
  `id_kategori` tinyint NOT NULL,
  `is_publik` tinyint(1) NOT NULL DEFAULT '0',
  `is_teks` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `id_master` (`id_master`,`id_tipe`),
  KEY `id_tipe` (`id_tipe`),
  KEY `id_kategori` (`id_kategori`)
) ENGINE=InnoDB AUTO_INCREMENT=245 DEFAULT CHARSET=latin1;

-- Table: analisis_kategori_indikator
CREATE TABLE `analisis_kategori_indikator` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `id_master` tinyint NOT NULL,
  `kategori` varchar(50) NOT NULL,
  `kategori_kode` varchar(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_master` (`id_master`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=latin1;

-- Table: analisis_klasifikasi
CREATE TABLE `analisis_klasifikasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_master` int NOT NULL,
  `nama` varchar(255) NOT NULL,
  `minval` double(5,3) NOT NULL,
  `maxval` double(5,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_master` (`id_master`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

-- Table: analisis_master
CREATE TABLE `analisis_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(40) NOT NULL,
  `subjek_tipe` tinyint NOT NULL,
  `petugas` varchar(100) NOT NULL,
  `lock` tinyint(1) NOT NULL DEFAULT '1',
  `deskripsi` text NOT NULL,
  `kode_analisis` varchar(5) NOT NULL DEFAULT '00000',
  `id_kelompok` int NOT NULL,
  `pembagi` varchar(10) NOT NULL DEFAULT '100',
  `id_child` smallint NOT NULL,
  `format_impor` tinyint NOT NULL,
  `jenis` tinyint NOT NULL DEFAULT '2',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

-- Table: analisis_parameter
CREATE TABLE `analisis_parameter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_indikator` int NOT NULL,
  `jawaban` varchar(200) NOT NULL,
  `nilai` double(5,3) NOT NULL DEFAULT '0.000',
  `kode_jawaban` int NOT NULL,
  `asign` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `id_indikator` (`id_indikator`)
) ENGINE=InnoDB AUTO_INCREMENT=2150 DEFAULT CHARSET=latin1;

-- Table: analisis_partisipasi
CREATE TABLE `analisis_partisipasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_subjek` int NOT NULL,
  `id_master` int NOT NULL,
  `id_periode` int NOT NULL,
  `id_klassifikasi` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_subjek` (`id_subjek`,`id_master`,`id_periode`,`id_klassifikasi`),
  KEY `id_master` (`id_master`),
  KEY `id_periode` (`id_periode`),
  KEY `id_klassifikasi` (`id_klassifikasi`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: analisis_periode
CREATE TABLE `analisis_periode` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_master` int NOT NULL,
  `nama` varchar(50) NOT NULL,
  `id_state` tinyint NOT NULL DEFAULT '1',
  `aktif` tinyint(1) NOT NULL DEFAULT '0',
  `keterangan` varchar(100) NOT NULL,
  `tahun_pelaksanaan` year NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_master` (`id_master`),
  KEY `id_state` (`id_state`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;

-- Table: analisis_ref_state
CREATE TABLE `analisis_ref_state` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `nama` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- Table: analisis_ref_subjek
CREATE TABLE `analisis_ref_subjek` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `subjek` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;

-- Table: analisis_respon
CREATE TABLE `analisis_respon` (
  `id_indikator` int NOT NULL,
  `id_parameter` int NOT NULL,
  `id_subjek` int NOT NULL,
  `id_periode` int NOT NULL,
  KEY `id_parameter` (`id_parameter`,`id_subjek`),
  KEY `id_periode` (`id_periode`),
  KEY `id_indikator` (`id_indikator`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: analisis_respon_bukti
CREATE TABLE `analisis_respon_bukti` (
  `id_master` tinyint NOT NULL,
  `id_periode` tinyint NOT NULL,
  `id_subjek` int NOT NULL,
  `pengesahan` varchar(100) NOT NULL,
  `tgl_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: analisis_respon_hasil
CREATE TABLE `analisis_respon_hasil` (
  `id_master` tinyint NOT NULL,
  `id_periode` tinyint NOT NULL,
  `id_subjek` int NOT NULL,
  `akumulasi` double(8,3) NOT NULL,
  `tgl_update` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `id_master` (`id_master`,`id_periode`,`id_subjek`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: analisis_tipe_indikator
CREATE TABLE `analisis_tipe_indikator` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `tipe` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

-- Table: anggota_grup_kontak
CREATE TABLE `anggota_grup_kontak` (
  `id_grup_kontak` int NOT NULL AUTO_INCREMENT,
  `id_grup` int NOT NULL,
  `id_kontak` int NOT NULL,
  PRIMARY KEY (`id_grup_kontak`),
  KEY `anggota_grup_kontak_ke_kontak` (`id_kontak`),
  KEY `anggota_grup_kontak_ke_kontak_grup` (`id_grup`),
  CONSTRAINT `anggota_grup_kontak_ke_kontak` FOREIGN KEY (`id_kontak`) REFERENCES `kontak` (`id_kontak`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `anggota_grup_kontak_ke_kontak_grup` FOREIGN KEY (`id_grup`) REFERENCES `kontak_grup` (`id_grup`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: apbdes
CREATE TABLE `apbdes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_kategori` int NOT NULL DEFAULT '0',
  `id_artikel` int NOT NULL DEFAULT '0',
  `type` tinyint NOT NULL DEFAULT '1',
  `nama_anggaran` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `jumlah` double NOT NULL,
  `tahun` year NOT NULL,
  `tahap` varchar(40) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `koordinator` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `warna_bar` varchar(50) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'info',
  PRIMARY KEY (`id`),
  KEY `id_kategori` (`id_kategori`),
  KEY `id_artikel` (`id_artikel`),
  CONSTRAINT `FK_apbdes` FOREIGN KEY (`id_kategori`) REFERENCES `apbdes_kategori` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: apbdes_kategori
CREATE TABLE `apbdes_kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategori` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `kategori_slug` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `urut` tinyint NOT NULL,
  `enabled` tinyint NOT NULL,
  `parrent` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: area
CREATE TABLE `area` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `path` text,
  `enabled` int NOT NULL DEFAULT '1',
  `warna` text,
  `ref_polygon` int NOT NULL,
  `foto` varchar(250) DEFAULT NULL,
  `id_cluster` int DEFAULT NULL,
  `desk` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: artikel
CREATE TABLE `artikel` (
  `id` int NOT NULL AUTO_INCREMENT,
  `gambar` varchar(200) DEFAULT NULL,
  `caption` varchar(100) DEFAULT NULL,
  `isi` text NOT NULL,
  `enabled` int NOT NULL DEFAULT '1',
  `tgl_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_kategori` int NOT NULL,
  `id_user` int NOT NULL,
  `judul` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `headline` int NOT NULL DEFAULT '0',
  `gambar1` varchar(200) DEFAULT NULL,
  `caption1` varchar(100) DEFAULT NULL,
  `gambar2` varchar(200) DEFAULT NULL,
  `caption2` varchar(100) DEFAULT NULL,
  `gambar3` varchar(200) DEFAULT NULL,
  `caption3` varchar(100) DEFAULT NULL,
  `link_embed` text,
  `sumber_berita` varchar(100) DEFAULT NULL,
  `link_sumber_berita` varchar(100) DEFAULT NULL,
  `dokumen` varchar(400) DEFAULT NULL,
  `link_dokumen` varchar(200) NOT NULL,
  `urut` int DEFAULT NULL,
  `jenis_widget` tinyint NOT NULL DEFAULT '3',
  `boleh_komentar` tinyint(1) NOT NULL DEFAULT '1',
  `hit` int NOT NULL DEFAULT '0',
  `by_warga` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=195 DEFAULT CHARSET=utf8mb3;

-- Table: captcha_codes
CREATE TABLE `captcha_codes` (
  `id` varchar(40) NOT NULL,
  `namespace` varchar(32) NOT NULL,
  `code` varchar(32) NOT NULL,
  `code_display` varchar(32) NOT NULL,
  `created` int NOT NULL,
  `audio_data` mediumblob,
  PRIMARY KEY (`id`,`namespace`),
  KEY `created` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: ci_sessions
CREATE TABLE `ci_sessions` (
  `id` varchar(128) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `timestamp` int unsigned NOT NULL DEFAULT '0',
  `data` blob NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ci_sessions_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: config
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_desa` varchar(100) NOT NULL,
  `kode_desa` varchar(100) NOT NULL,
  `nama_kepala_desa` varchar(100) NOT NULL,
  `nip_kepala_desa` varchar(100) NOT NULL,
  `kode_pos` varchar(6) NOT NULL,
  `nama_kecamatan` varchar(100) NOT NULL,
  `kode_kecamatan` varchar(100) NOT NULL,
  `nama_kepala_camat` varchar(100) NOT NULL,
  `nip_kepala_camat` varchar(100) NOT NULL,
  `nama_kabupaten` varchar(100) NOT NULL,
  `kode_kabupaten` varchar(100) NOT NULL,
  `nama_propinsi` varchar(100) NOT NULL,
  `kode_propinsi` varchar(100) NOT NULL,
  `logo` varchar(100) NOT NULL,
  `lat` varchar(20) NOT NULL,
  `lng` varchar(20) NOT NULL,
  `zoom` tinyint NOT NULL,
  `map_tipe` varchar(20) NOT NULL,
  `path` text NOT NULL,
  `alamat_kantor` varchar(200) DEFAULT NULL,
  `g_analytic` varchar(200) NOT NULL,
  `email_desa` varchar(50) DEFAULT NULL,
  `telepon` varchar(50) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `tentang` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb3;

-- Table: daftar_anggota_grup
;

-- Table: daftar_grup
;

-- Table: daftar_kontak
;

-- Table: data_persil
CREATE TABLE `data_persil` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pend` int DEFAULT NULL,
  `nama` varchar(128) NOT NULL COMMENT 'nomer persil',
  `persil_jenis_id` tinyint NOT NULL,
  `id_clusterdesa` int NOT NULL,
  `luas` decimal(7,2) NOT NULL,
  `no_sppt_pbb` varchar(128) NOT NULL,
  `kelas` varchar(128) DEFAULT NULL,
  `persil_peruntukan_id` tinyint NOT NULL,
  `alamat_luar` varchar(100) DEFAULT NULL,
  `userID` mediumint DEFAULT NULL,
  `peta` text,
  `rdate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `jenis_pemilik` tinyint NOT NULL DEFAULT '1',
  `pemilik_luar` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_pend` (`id_pend`),
  CONSTRAINT `persil_pend_fk` FOREIGN KEY (`id_pend`) REFERENCES `tweb_penduduk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: data_persil_jenis
CREATE TABLE `data_persil_jenis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(128) NOT NULL,
  `ndesc` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: data_persil_peruntukan
CREATE TABLE `data_persil_peruntukan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(128) NOT NULL,
  `ndesc` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: detail_log_penduduk
CREATE TABLE `detail_log_penduduk` (
  `id` int NOT NULL,
  `nama` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: disposisi_surat_masuk
CREATE TABLE `disposisi_surat_masuk` (
  `id_disposisi` int NOT NULL AUTO_INCREMENT,
  `id_surat_masuk` int NOT NULL,
  `id_desa_pamong` int DEFAULT NULL,
  `disposisi_ke` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_disposisi`),
  KEY `id_surat_fk` (`id_surat_masuk`),
  KEY `desa_pamong_fk` (`id_desa_pamong`),
  CONSTRAINT `desa_pamong_fk` FOREIGN KEY (`id_desa_pamong`) REFERENCES `tweb_desa_pamong` (`pamong_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `id_surat_fk` FOREIGN KEY (`id_surat_masuk`) REFERENCES `surat_masuk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: dokumen
CREATE TABLE `dokumen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `satuan` varchar(200) NOT NULL,
  `nama` varchar(250) NOT NULL,
  `enabled` int NOT NULL DEFAULT '1',
  `tgl_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_pend` int NOT NULL DEFAULT '0',
  `kategori` tinyint NOT NULL DEFAULT '1',
  `attr` text NOT NULL,
  `hit` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;

-- Table: gambar_gallery
CREATE TABLE `gambar_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parrent` int NOT NULL,
  `gambar` varchar(200) NOT NULL,
  `nama` varchar(50) NOT NULL,
  `enabled` int NOT NULL DEFAULT '1',
  `tgl_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tipe` int NOT NULL,
  `slider` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `parrent` (`parrent`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb3;

-- Table: garis
CREATE TABLE `garis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `path` text,
  `enabled` int NOT NULL DEFAULT '1',
  `ref_line` int NOT NULL,
  `foto` varchar(100) NOT NULL,
  `desk` text NOT NULL,
  `id_cluster` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: gis_simbol
CREATE TABLE `gis_simbol` (
  `simbol` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: idm
CREATE TABLE `idm` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tahun` year NOT NULL,
  `data` longtext COLLATE utf8mb4_general_ci NOT NULL,
  `kode` varchar(11) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: inbox
CREATE TABLE `inbox` (
  `UpdatedInDB` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ReceivingDateTime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `Text` text NOT NULL,
  `SenderNumber` varchar(20) NOT NULL DEFAULT '',
  `Coding` enum('Default_No_Compression','Unicode_No_Compression','8bit','Default_Compression','Unicode_Compression') NOT NULL DEFAULT 'Default_No_Compression',
  `UDH` text NOT NULL,
  `SMSCNumber` varchar(20) NOT NULL DEFAULT '',
  `Class` int NOT NULL DEFAULT '-1',
  `TextDecoded` text NOT NULL,
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `RecipientID` text NOT NULL,
  `Processed` enum('false','true') NOT NULL DEFAULT 'false',
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: inventaris_asset
CREATE TABLE `inventaris_asset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(64) NOT NULL,
  `register` varchar(64) NOT NULL,
  `jenis` varchar(255) NOT NULL,
  `judul_buku` varchar(255) DEFAULT NULL,
  `spesifikasi_buku` varchar(255) DEFAULT NULL,
  `asal_daerah` varchar(255) DEFAULT NULL,
  `pencipta` varchar(255) DEFAULT NULL,
  `bahan` varchar(255) DEFAULT NULL,
  `jenis_hewan` varchar(255) DEFAULT NULL,
  `ukuran_hewan` varchar(255) DEFAULT NULL,
  `jenis_tumbuhan` varchar(255) DEFAULT NULL,
  `ukuran_tumbuhan` varchar(255) DEFAULT NULL,
  `jumlah` int NOT NULL,
  `tahun_pengadaan` year NOT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: inventaris_elektronik
CREATE TABLE `inventaris_elektronik` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `kode_barang` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `register` varchar(64) COLLATE utf8mb4_general_ci NOT NULL,
  `merk` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ukuran` text COLLATE utf8mb4_general_ci NOT NULL,
  `bahan` text COLLATE utf8mb4_general_ci NOT NULL,
  `tahun_pengadaan` year NOT NULL,
  `no_mesin` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `asal` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: inventaris_gedung
CREATE TABLE `inventaris_gedung` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(64) NOT NULL,
  `register` varchar(64) NOT NULL,
  `kondisi_bangunan` varchar(255) NOT NULL,
  `kontruksi_bertingkat` varchar(255) NOT NULL,
  `kontruksi_beton` int NOT NULL,
  `luas_bangunan` int NOT NULL,
  `letak` varchar(255) NOT NULL,
  `tanggal_dokument` date DEFAULT NULL,
  `no_dokument` varchar(255) DEFAULT NULL,
  `luas` int DEFAULT NULL,
  `status_tanah` varchar(255) DEFAULT NULL,
  `kode_tanah` varchar(255) DEFAULT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: inventaris_jalan
CREATE TABLE `inventaris_jalan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(64) NOT NULL,
  `register` varchar(64) NOT NULL,
  `kontruksi` varchar(255) NOT NULL,
  `panjang` int NOT NULL,
  `lebar` int NOT NULL,
  `luas` int NOT NULL,
  `letak` text,
  `tanggal_dokument` date NOT NULL,
  `no_dokument` varchar(255) DEFAULT NULL,
  `status_tanah` varchar(255) DEFAULT NULL,
  `kode_tanah` varchar(255) DEFAULT NULL,
  `kondisi` varchar(255) NOT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: inventaris_kontruksi
CREATE TABLE `inventaris_kontruksi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kondisi_bangunan` varchar(255) NOT NULL,
  `kontruksi_bertingkat` varchar(255) NOT NULL,
  `kontruksi_beton` int NOT NULL,
  `luas_bangunan` int NOT NULL,
  `letak` varchar(255) NOT NULL,
  `tanggal_dokument` date DEFAULT NULL,
  `no_dokument` varchar(255) DEFAULT NULL,
  `tanggal` date DEFAULT NULL,
  `status_tanah` varchar(255) DEFAULT NULL,
  `kode_tanah` varchar(255) DEFAULT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: inventaris_mesin
CREATE TABLE `inventaris_mesin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(64) NOT NULL,
  `register` varchar(64) NOT NULL,
  `merk` varchar(255) NOT NULL,
  `ukuran` text NOT NULL,
  `bahan` text NOT NULL,
  `tahun_pengadaan` year NOT NULL,
  `no_pabrik` varchar(255) DEFAULT NULL,
  `no_rangka` varchar(255) DEFAULT NULL,
  `no_mesin` varchar(255) DEFAULT NULL,
  `no_polisi` varchar(255) DEFAULT NULL,
  `no_bpkb` varchar(255) DEFAULT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: inventaris_tanah
CREATE TABLE `inventaris_tanah` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `kode_barang` varchar(64) NOT NULL,
  `register` varchar(64) NOT NULL,
  `luas` int NOT NULL,
  `tahun_pengadaan` year NOT NULL,
  `letak` varchar(255) NOT NULL,
  `hak` varchar(255) NOT NULL,
  `no_sertifikat` varchar(255) NOT NULL,
  `tanggal_sertifikat` date NOT NULL,
  `penggunaan` varchar(255) NOT NULL,
  `asal` varchar(255) NOT NULL,
  `harga` double NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `status` int NOT NULL DEFAULT '0',
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: kategori
CREATE TABLE `kategori` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kategori` varchar(100) NOT NULL,
  `kategori_slug` varchar(100) NOT NULL,
  `tipe` int NOT NULL DEFAULT '1',
  `urut` tinyint NOT NULL,
  `enabled` tinyint NOT NULL,
  `parrent` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1008 DEFAULT CHARSET=utf8mb3;

-- Table: kelompok
CREATE TABLE `kelompok` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_master` int NOT NULL,
  `id_ketua` int NOT NULL,
  `nama` varchar(50) NOT NULL,
  `keterangan` varchar(100) NOT NULL,
  `kode` varchar(16) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_ketua` (`id_ketua`),
  KEY `id_master` (`id_master`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: kelompok_anggota
CREATE TABLE `kelompok_anggota` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kelompok` int NOT NULL,
  `id_penduduk` int NOT NULL,
  `no_anggota` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_kelompok` (`id_kelompok`,`id_penduduk`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: kelompok_master
CREATE TABLE `kelompok_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kelompok` varchar(50) NOT NULL,
  `deskripsi` varchar(400) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: klasifikasi_analisis_keluarga
CREATE TABLE `klasifikasi_analisis_keluarga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(20) NOT NULL,
  `jenis` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: klasifikasi_surat
CREATE TABLE `klasifikasi_surat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(50) NOT NULL,
  `nama` varchar(250) NOT NULL,
  `uraian` mediumtext NOT NULL,
  `enabled` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- Table: komentar
CREATE TABLE `komentar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_artikel` int NOT NULL,
  `judul` varchar(100) DEFAULT NULL,
  `owner` varchar(50) NOT NULL,
  `email` varchar(50) NOT NULL,
  `komentar` text NOT NULL,
  `tgl_upload` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `enabled` int NOT NULL DEFAULT '2',
  `status` varchar(255) DEFAULT NULL,
  `no_hp` varchar(15) DEFAULT NULL,
  `jenis` int DEFAULT NULL,
  `gambar1` text,
  `gambar2` text,
  `gambar3` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb3;

-- Table: komentar_reply
CREATE TABLE `komentar_reply` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin` int NOT NULL DEFAULT '1',
  `tgl` int NOT NULL,
  `pesan` text COLLATE utf8mb4_general_ci NOT NULL,
  `id_komentar` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: kontak
CREATE TABLE `kontak` (
  `id_kontak` int NOT NULL AUTO_INCREMENT,
  `id_pend` int DEFAULT NULL,
  `no_hp` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id_kontak`),
  KEY `kontak_ke_tweb_penduduk` (`id_pend`),
  CONSTRAINT `kontak_ke_tweb_penduduk` FOREIGN KEY (`id_pend`) REFERENCES `tweb_penduduk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- Table: kontak_grup
CREATE TABLE `kontak_grup` (
  `id_grup` int NOT NULL AUTO_INCREMENT,
  `nama_grup` varchar(30) NOT NULL,
  PRIMARY KEY (`id_grup`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: lapak_barang
CREATE TABLE `lapak_barang` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(23) COLLATE utf8mb4_general_ci NOT NULL,
  `keterangan` text COLLATE utf8mb4_general_ci NOT NULL,
  `pemilik` int NOT NULL,
  `operator_penerima` int DEFAULT NULL,
  `operator_penolak` int DEFAULT NULL,
  `diterima_pada` timestamp NULL DEFAULT NULL,
  `ditolak_pada` timestamp NULL DEFAULT NULL,
  `ditambahkan_pada` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `kategori` int NOT NULL,
  `harga` double DEFAULT NULL,
  `stok` double DEFAULT NULL,
  `kondisi` int DEFAULT NULL,
  `gambar1` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gambar2` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `gambar3` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: lapak_gallery
CREATE TABLE `lapak_gallery` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sumber` text COLLATE utf8mb4_general_ci NOT NULL,
  `barang` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: lapak_toko
CREATE TABLE `lapak_toko` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_penduduk` int NOT NULL,
  `nama` varchar(225) COLLATE utf8mb4_general_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_general_ci NOT NULL,
  `alamat` text COLLATE utf8mb4_general_ci NOT NULL,
  `wa` varchar(14) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: line
CREATE TABLE `line` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `simbol` varchar(50) NOT NULL,
  `color` varchar(10) NOT NULL DEFAULT 'ff0000',
  `tipe` int NOT NULL DEFAULT '0',
  `parrent` int DEFAULT '1',
  `enabled` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `parrent` (`parrent`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: log_bulanan
CREATE TABLE `log_bulanan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pend` int NOT NULL,
  `wni_lk` int DEFAULT NULL,
  `wni_pr` int DEFAULT NULL,
  `kk` int NOT NULL,
  `tgl` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `kk_lk` int DEFAULT NULL,
  `kk_pr` int DEFAULT NULL,
  `wna_lk` int DEFAULT NULL,
  `wna_pr` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;

-- Table: log_keluarga
CREATE TABLE `log_keluarga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kk` int NOT NULL,
  `kk_sex` tinyint DEFAULT NULL,
  `id_peristiwa` int NOT NULL,
  `tgl_peristiwa` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_kk` (`id_kk`,`id_peristiwa`,`tgl_peristiwa`)
) ENGINE=InnoDB AUTO_INCREMENT=726 DEFAULT CHARSET=utf8mb3;

-- Table: log_penduduk
CREATE TABLE `log_penduduk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pend` int NOT NULL,
  `id_detail` int NOT NULL,
  `tanggal` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bulan` varchar(2) NOT NULL,
  `tahun` varchar(4) NOT NULL,
  `tgl_peristiwa` date NOT NULL,
  `catatan` text,
  `no_kk` decimal(16,0) DEFAULT NULL,
  `nama_kk` varchar(100) DEFAULT NULL,
  `ref_pindah` tinyint DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_pend` (`id_pend`,`id_detail`,`tgl_peristiwa`),
  KEY `id_ref_pindah` (`ref_pindah`),
  CONSTRAINT `id_ref_pindah` FOREIGN KEY (`ref_pindah`) REFERENCES `ref_pindah` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2617 DEFAULT CHARSET=utf8mb3;

-- Table: log_perubahan_penduduk
CREATE TABLE `log_perubahan_penduduk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_pend` int NOT NULL,
  `id_cluster` varchar(200) NOT NULL,
  `tanggal` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=732 DEFAULT CHARSET=utf8mb3;

-- Table: log_surat
CREATE TABLE `log_surat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_format_surat` int NOT NULL,
  `id_pend` int DEFAULT NULL,
  `id_pamong` int NOT NULL,
  `id_user` int NOT NULL,
  `tanggal` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bulan` varchar(2) DEFAULT NULL,
  `tahun` varchar(4) DEFAULT NULL,
  `no_surat` varchar(20) DEFAULT NULL,
  `nama_surat` varchar(100) DEFAULT NULL,
  `lampiran` varchar(100) DEFAULT NULL,
  `nik_non_warga` decimal(16,0) DEFAULT NULL,
  `nama_non_warga` varchar(100) DEFAULT NULL,
  `verifikasi_token` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_log_surat_id_pend` (`id_pend`),
  KEY `idx_log_surat_id_format` (`id_format_surat`),
  KEY `idx_log_surat_tanggal` (`tanggal`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb3;

-- Table: lokasi
CREATE TABLE `lokasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `desk` text NOT NULL,
  `nama` varchar(50) NOT NULL,
  `enabled` int NOT NULL DEFAULT '1',
  `lat` varchar(30) DEFAULT NULL,
  `lng` varchar(30) DEFAULT NULL,
  `ref_point` int NOT NULL,
  `foto` varchar(250) DEFAULT NULL,
  `id_cluster` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ref_point` (`ref_point`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Table: media_sosial
CREATE TABLE `media_sosial` (
  `id` int NOT NULL AUTO_INCREMENT,
  `icon` text NOT NULL,
  `link` text NOT NULL,
  `nama` varchar(100) NOT NULL,
  `enabled` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb3;

-- Table: menu
CREATE TABLE `menu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `link` varchar(500) NOT NULL,
  `tipe` int NOT NULL,
  `parrent` int NOT NULL DEFAULT '1',
  `link_tipe` tinyint(1) NOT NULL DEFAULT '0',
  `enabled` int NOT NULL DEFAULT '1',
  `urut` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb3;

-- Table: mutasi_inventaris_asset
CREATE TABLE `mutasi_inventaris_asset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inventaris_asset` int DEFAULT NULL,
  `jenis_mutasi` varchar(255) NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_mutasi_inventaris_asset` (`id_inventaris_asset`),
  CONSTRAINT `FK_mutasi_inventaris_asset` FOREIGN KEY (`id_inventaris_asset`) REFERENCES `inventaris_asset` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: mutasi_inventaris_elektronik
CREATE TABLE `mutasi_inventaris_elektronik` (
  `id` int NOT NULL,
  `id_inventaris_elektronik` int DEFAULT '0',
  `jenis_mutasi` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `keterangan` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` datetime NOT NULL,
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_inventaris_elektronik` (`id_inventaris_elektronik`),
  CONSTRAINT `FK_mutasi_inventaris_elektronik` FOREIGN KEY (`id_inventaris_elektronik`) REFERENCES `inventaris_elektronik` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: mutasi_inventaris_gedung
CREATE TABLE `mutasi_inventaris_gedung` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inventaris_gedung` int DEFAULT NULL,
  `jenis_mutasi` varchar(255) NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_mutasi_inventaris_gedung` (`id_inventaris_gedung`),
  CONSTRAINT `FK_mutasi_inventaris_gedung` FOREIGN KEY (`id_inventaris_gedung`) REFERENCES `inventaris_gedung` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: mutasi_inventaris_jalan
CREATE TABLE `mutasi_inventaris_jalan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inventaris_jalan` int DEFAULT NULL,
  `jenis_mutasi` varchar(255) NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_mutasi_inventaris_jalan` (`id_inventaris_jalan`),
  CONSTRAINT `FK_mutasi_inventaris_jalan` FOREIGN KEY (`id_inventaris_jalan`) REFERENCES `inventaris_jalan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: mutasi_inventaris_mesin
CREATE TABLE `mutasi_inventaris_mesin` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inventaris_peralatan` int DEFAULT NULL,
  `jenis_mutasi` varchar(255) NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_mutasi_inventaris_peralatan` (`id_inventaris_peralatan`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: mutasi_inventaris_tanah
CREATE TABLE `mutasi_inventaris_tanah` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_inventaris_tanah` int DEFAULT NULL,
  `jenis_mutasi` varchar(255) NOT NULL,
  `tahun_mutasi` date NOT NULL,
  `harga_jual` double NOT NULL,
  `sumbangkan` varchar(255) NOT NULL,
  `keterangan` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_by` int NOT NULL,
  `visible` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `FK_mutasi_inventaris_tanah` (`id_inventaris_tanah`),
  CONSTRAINT `FK_mutasi_inventaris_tanah` FOREIGN KEY (`id_inventaris_tanah`) REFERENCES `inventaris_tanah` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: outbox
CREATE TABLE `outbox` (
  `UpdatedInDB` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `InsertIntoDB` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `SendingDateTime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `SendBefore` time NOT NULL DEFAULT '23:59:59',
  `SendAfter` time NOT NULL DEFAULT '00:00:00',
  `Text` text,
  `DestinationNumber` varchar(20) NOT NULL DEFAULT '',
  `Coding` enum('Default_No_Compression','Unicode_No_Compression','8bit','Default_Compression','Unicode_Compression') NOT NULL DEFAULT 'Default_No_Compression',
  `UDH` text,
  `Class` int DEFAULT '-1',
  `TextDecoded` text NOT NULL,
  `ID` int unsigned NOT NULL AUTO_INCREMENT,
  `MultiPart` enum('false','true') DEFAULT 'false',
  `RelativeValidity` int DEFAULT '-1',
  `SenderID` varchar(255) DEFAULT NULL,
  `SendingTimeOut` timestamp NULL DEFAULT '0000-00-00 00:00:00',
  `DeliveryReport` enum('default','yes','no') DEFAULT 'default',
  `CreatorID` text NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `outbox_date` (`SendingDateTime`,`SendingTimeOut`),
  KEY `outbox_sender` (`SenderID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: pembangunan
CREATE TABLE `pembangunan` (
  `id_pembangunan` int NOT NULL AUTO_INCREMENT,
  `bidang_pembangunan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sub_bidang_pembangunan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `nama_kegiatan_pembangunan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `volume_kegiatan_pembangunan` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `lokasi_pembangunan` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `koordinator_pembangunan` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `nilai_pembangunan` int NOT NULL,
  `sumber_dana_pembangunan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `waktu_pelaksanaan_pembangunan` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `id_artikel` int NOT NULL,
  PRIMARY KEY (`id_pembangunan`),
  KEY `id_artikel` (`id_artikel`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: penduduk_hidup
;

-- Table: pertanyaan
CREATE TABLE `pertanyaan` (
  `1` int DEFAULT NULL,
  `Pendapatan perkapita perbulan` varchar(87) DEFAULT NULL,
  `36` int DEFAULT NULL,
  `15` int DEFAULT NULL,
  `24` int DEFAULT NULL,
  `23` int DEFAULT NULL,
  `26` int DEFAULT NULL,
  `28` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: point
CREATE TABLE `point` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `simbol` varchar(50) NOT NULL,
  `tipe` int NOT NULL DEFAULT '0',
  `parrent` int NOT NULL DEFAULT '1',
  `enabled` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `parrent` (`parrent`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: poll_pilihan
CREATE TABLE `poll_pilihan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_poll` int NOT NULL,
  `nama` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  `status` enum('1','0') CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `id_poll` (`id_poll`),
  CONSTRAINT `poll_pilihan_ibfk_1` FOREIGN KEY (`id_poll`) REFERENCES `polling` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: poll_vote
CREATE TABLE `poll_vote` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_poll` int NOT NULL,
  `id_pil` int NOT NULL,
  `alasan` text COLLATE utf8mb4_general_ci,
  `jumlah_vote` tinyint NOT NULL DEFAULT '1',
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_poll` (`id_poll`),
  KEY `id_pil` (`id_pil`),
  CONSTRAINT `poll_vote_ibfk_1` FOREIGN KEY (`id_poll`) REFERENCES `polling` (`id`) ON DELETE CASCADE,
  CONSTRAINT `poll_vote_ibfk_2` FOREIGN KEY (`id_pil`) REFERENCES `poll_pilihan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: polling
CREATE TABLE `polling` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pertanyaan` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('1','0') COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: polygon
CREATE TABLE `polygon` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `simbol` varchar(50) NOT NULL,
  `color` varchar(10) NOT NULL DEFAULT 'ff0000',
  `tipe` int NOT NULL DEFAULT '0',
  `parrent` int DEFAULT '1',
  `enabled` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `parrent` (`parrent`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: potensi
CREATE TABLE `potensi` (
  `id_potensi` int NOT NULL AUTO_INCREMENT,
  `nama_produk` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `pengelola_produk` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `kontak_pengelola` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `id_artikel` int NOT NULL,
  PRIMARY KEY (`id_potensi`),
  KEY `id_artikel` (`id_artikel`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: program
CREATE TABLE `program` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `sasaran` tinyint DEFAULT NULL,
  `ndesc` varchar(200) DEFAULT NULL,
  `sdate` date NOT NULL,
  `edate` date NOT NULL,
  `userid` mediumint NOT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

-- Table: program_peserta
CREATE TABLE `program_peserta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `peserta` decimal(16,0) NOT NULL,
  `program_id` int NOT NULL,
  `sasaran` tinyint DEFAULT NULL,
  `no_id_kartu` varchar(30) DEFAULT NULL,
  `kartu_nik` decimal(16,0) DEFAULT NULL,
  `kartu_nama` varchar(100) DEFAULT NULL,
  `kartu_tempat_lahir` varchar(100) DEFAULT NULL,
  `kartu_tanggal_lahir` date DEFAULT NULL,
  `kartu_alamat` varchar(200) DEFAULT NULL,
  `kartu_peserta` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;

-- Table: provinsi
CREATE TABLE `provinsi` (
  `kode` tinyint NOT NULL DEFAULT '0',
  `nama` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: ref_pindah
CREATE TABLE `ref_pindah` (
  `id` tinyint NOT NULL,
  `nama` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: sambutan
CREATE TABLE `sambutan` (
  `id_sambutan` int NOT NULL AUTO_INCREMENT,
  `pemberi_sambutan` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `jabatan_sambutan` varchar(500) COLLATE utf8mb4_general_ci NOT NULL,
  `foto_sambutan` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `id_artikel` int NOT NULL,
  PRIMARY KEY (`id_sambutan`),
  KEY `id_artikel` (`id_artikel`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: sentitems
CREATE TABLE `sentitems` (
  `UpdatedInDB` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `InsertIntoDB` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `SendingDateTime` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `DeliveryDateTime` timestamp NULL DEFAULT NULL,
  `Text` text NOT NULL,
  `DestinationNumber` varchar(20) NOT NULL DEFAULT '',
  `Coding` enum('Default_No_Compression','Unicode_No_Compression','8bit','Default_Compression','Unicode_Compression') NOT NULL DEFAULT 'Default_No_Compression',
  `UDH` text NOT NULL,
  `SMSCNumber` varchar(20) NOT NULL DEFAULT '',
  `Class` int NOT NULL DEFAULT '-1',
  `TextDecoded` text NOT NULL,
  `ID` int unsigned NOT NULL DEFAULT '0',
  `SenderID` varchar(255) NOT NULL,
  `SequencePosition` int NOT NULL DEFAULT '1',
  `Status` enum('SendingOK','SendingOKNoReport','SendingError','DeliveryOK','DeliveryFailed','DeliveryPending','DeliveryUnknown','Error') NOT NULL DEFAULT 'SendingOK',
  `StatusError` int NOT NULL DEFAULT '-1',
  `TPMR` int NOT NULL DEFAULT '-1',
  `RelativeValidity` int NOT NULL DEFAULT '-1',
  `CreatorID` text NOT NULL,
  PRIMARY KEY (`ID`,`SequencePosition`),
  KEY `sentitems_date` (`DeliveryDateTime`),
  KEY `sentitems_tpmr` (`TPMR`),
  KEY `sentitems_dest` (`DestinationNumber`),
  KEY `sentitems_sender` (`SenderID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: setting_aplikasi
CREATE TABLE `setting_aplikasi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(50) DEFAULT NULL,
  `value` text,
  `keterangan` varchar(200) DEFAULT NULL,
  `jenis` varchar(30) DEFAULT NULL,
  `kategori` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=latin1;

-- Table: setting_aplikasi_options
CREATE TABLE `setting_aplikasi_options` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_setting` int NOT NULL,
  `value` varchar(512) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_setting_fk` (`id_setting`),
  CONSTRAINT `id_setting_fk` FOREIGN KEY (`id_setting`) REFERENCES `setting_aplikasi` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- Table: setting_modul
CREATE TABLE `setting_modul` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modul` varchar(50) NOT NULL,
  `url` varchar(50) NOT NULL,
  `aktif` tinyint(1) NOT NULL DEFAULT '0',
  `ikon` varchar(50) NOT NULL,
  `urut` tinyint NOT NULL,
  `level` tinyint(1) NOT NULL DEFAULT '2',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  `ikon_kecil` varchar(50) NOT NULL,
  `parent` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=211 DEFAULT CHARSET=utf8mb3;

-- Table: setting_sms
CREATE TABLE `setting_sms` (
  `autoreply_text` varchar(160) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: suplemen
CREATE TABLE `suplemen` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) DEFAULT NULL,
  `sasaran` tinyint DEFAULT NULL,
  `keterangan` varchar(300) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Table: suplemen_terdata
CREATE TABLE `suplemen_terdata` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_suplemen` int DEFAULT NULL,
  `id_terdata` varchar(20) DEFAULT NULL,
  `sasaran` tinyint DEFAULT NULL,
  `keterangan` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_suplemen` (`id_suplemen`),
  CONSTRAINT `suplemen_terdata_ibfk_1` FOREIGN KEY (`id_suplemen`) REFERENCES `suplemen` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Table: surat_keluar
CREATE TABLE `surat_keluar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomor_urut` smallint DEFAULT NULL,
  `nomor_surat` varchar(35) DEFAULT NULL,
  `kode_surat` varchar(10) DEFAULT NULL,
  `tanggal_surat` date NOT NULL,
  `tanggal_catat` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tujuan` varchar(100) DEFAULT NULL,
  `isi_singkat` varchar(200) DEFAULT NULL,
  `berkas_scan` varchar(100) DEFAULT NULL,
  `verifikasi_token` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Table: surat_masuk
CREATE TABLE `surat_masuk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomor_urut` smallint DEFAULT NULL,
  `tanggal_penerimaan` date NOT NULL,
  `nomor_surat` varchar(35) DEFAULT NULL,
  `kode_surat` varchar(10) DEFAULT NULL,
  `tanggal_surat` date NOT NULL,
  `pengirim` varchar(100) DEFAULT NULL,
  `isi_singkat` varchar(200) DEFAULT NULL,
  `isi_disposisi` varchar(200) DEFAULT NULL,
  `berkas_scan` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: sys_traffic
CREATE TABLE `sys_traffic` (
  `Tanggal` date NOT NULL,
  `ipAddress` text NOT NULL,
  `Jumlah` int NOT NULL,
  PRIMARY KEY (`Tanggal`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: tweb_aset
CREATE TABLE `tweb_aset` (
  `id_aset` int NOT NULL,
  `golongan` varchar(11) NOT NULL,
  `bidang` varchar(11) NOT NULL,
  `kelompok` varchar(11) NOT NULL,
  `sub_kelompok` varchar(11) NOT NULL,
  `sub_sub_kelompok` varchar(11) NOT NULL,
  `nama` varchar(255) NOT NULL,
  PRIMARY KEY (`id_aset`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: tweb_cacat
CREATE TABLE `tweb_cacat` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_cara_kb
CREATE TABLE `tweb_cara_kb` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `sex` tinyint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_desa_pamong
CREATE TABLE `tweb_desa_pamong` (
  `pamong_id` int NOT NULL AUTO_INCREMENT,
  `pamong_nama` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_nip` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_nik` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `jabatan` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT '0',
  `tupoksi` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `pamong_status` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_tgl_terdaftar` date DEFAULT NULL,
  `pamong_ttd` tinyint(1) DEFAULT NULL,
  `foto` varchar(100) COLLATE utf8mb3_unicode_ci NOT NULL,
  `id_pend` int DEFAULT NULL,
  `pamong_tempatlahir` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_tanggallahir` date DEFAULT NULL,
  `pamong_sex` tinyint DEFAULT NULL,
  `pamong_pendidikan` int DEFAULT NULL,
  `pamong_agama` int DEFAULT NULL,
  `pamong_nosk` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_tglsk` date DEFAULT NULL,
  `pamong_masajab` varchar(120) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_niap` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_pangkat` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_nohenti` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `pamong_tglhenti` date DEFAULT NULL,
  `urut` int DEFAULT NULL,
  `pamong_ub` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`pamong_id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- Table: tweb_golongan_darah
CREATE TABLE `tweb_golongan_darah` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_keluarga
CREATE TABLE `tweb_keluarga` (
  `id` int NOT NULL AUTO_INCREMENT,
  `no_kk` varchar(160) DEFAULT NULL,
  `nik_kepala` varchar(200) DEFAULT NULL,
  `tgl_daftar` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `kelas_sosial` int DEFAULT NULL,
  `tgl_cetak_kk` datetime DEFAULT NULL,
  `alamat` varchar(200) DEFAULT NULL,
  `id_cluster` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `nik_kepala` (`nik_kepala`),
  KEY `idx_keluarga_no_kk` (`no_kk`)
) ENGINE=InnoDB AUTO_INCREMENT=762 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_keluarga_sejahtera
CREATE TABLE `tweb_keluarga_sejahtera` (
  `id` int NOT NULL DEFAULT '0',
  `nama` varchar(100) DEFAULT NULL,
  `nama_analisis` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: tweb_kontak
CREATE TABLE `tweb_kontak` (
  `id` int NOT NULL,
  `parent` int DEFAULT NULL,
  `nama` varchar(60) NOT NULL,
  `email` varchar(62) DEFAULT NULL,
  `no_hp` varchar(16) DEFAULT NULL,
  `hal` tinyint DEFAULT NULL,
  `isi` text NOT NULL,
  `waktu` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `baca` timestamp NULL DEFAULT NULL,
  `judul` varchar(256) DEFAULT NULL,
  `admin` tinyint DEFAULT NULL,
  `ip4` varchar(16) NOT NULL,
  `ua` varchar(128) NOT NULL,
  `token` varchar(13) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: tweb_penduduk
CREATE TABLE `tweb_penduduk` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `nik` decimal(16,0) NOT NULL,
  `id_kk` int DEFAULT '0',
  `kk_level` tinyint NOT NULL DEFAULT '0',
  `id_rtm` int NOT NULL,
  `rtm_level` int NOT NULL,
  `sex` tinyint unsigned DEFAULT NULL,
  `tempatlahir` varchar(100) NOT NULL,
  `tanggallahir` date DEFAULT NULL,
  `agama_id` int unsigned NOT NULL,
  `pendidikan_kk_id` int unsigned NOT NULL,
  `pendidikan_sedang_id` int unsigned NOT NULL,
  `pekerjaan_id` int unsigned NOT NULL,
  `status_kawin` tinyint unsigned NOT NULL,
  `warganegara_id` int unsigned NOT NULL,
  `dokumen_pasport` varchar(45) DEFAULT NULL,
  `dokumen_kitas` int DEFAULT NULL,
  `ayah_nik` varchar(16) NOT NULL,
  `ibu_nik` varchar(16) NOT NULL,
  `nama_ayah` varchar(100) NOT NULL,
  `nama_ibu` varchar(100) NOT NULL,
  `foto` varchar(100) NOT NULL,
  `golongan_darah_id` int NOT NULL,
  `id_cluster` int NOT NULL,
  `status` int unsigned DEFAULT NULL,
  `alamat_sebelumnya` varchar(200) NOT NULL,
  `alamat_sekarang` varchar(200) NOT NULL,
  `status_dasar` tinyint NOT NULL DEFAULT '1',
  `hamil` int DEFAULT NULL,
  `cacat_id` int DEFAULT NULL,
  `sakit_menahun_id` int NOT NULL,
  `akta_lahir` varchar(40) NOT NULL,
  `akta_perkawinan` varchar(40) NOT NULL,
  `tanggalperkawinan` date DEFAULT NULL,
  `akta_perceraian` varchar(40) NOT NULL,
  `tanggalperceraian` date DEFAULT NULL,
  `cara_kb_id` tinyint DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `tanggal_akhir_paspor` date DEFAULT NULL,
  `no_kk_sebelumnya` varchar(30) DEFAULT NULL,
  `ktp_el` tinyint NOT NULL,
  `status_rekam` tinyint NOT NULL DEFAULT '0',
  `waktu_lahir` varchar(5) NOT NULL,
  `tempat_dilahirkan` tinyint NOT NULL,
  `jenis_kelahiran` tinyint NOT NULL,
  `kelahiran_anak_ke` tinyint DEFAULT NULL,
  `penolong_kelahiran` tinyint NOT NULL,
  `berat_lahir` varchar(10) NOT NULL,
  `panjang_lahir` varchar(10) NOT NULL,
  `tag_id_card` varchar(15) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL,
  `tabel4_length` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_penduduk_nik` (`nik`),
  KEY `idx_penduduk_nama` (`nama`),
  KEY `idx_penduduk_status_dasar` (`status_dasar`),
  KEY `idx_penduduk_id_kk` (`id_kk`)
) ENGINE=InnoDB AUTO_INCREMENT=8846 DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_agama
CREATE TABLE `tweb_penduduk_agama` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_hubungan
CREATE TABLE `tweb_penduduk_hubungan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_kawin
CREATE TABLE `tweb_penduduk_kawin` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_mandiri
CREATE TABLE `tweb_penduduk_mandiri` (
  `pin` char(32) NOT NULL,
  `last_login` datetime DEFAULT NULL,
  `tanggal_buat` datetime DEFAULT NULL,
  `id_pend` int NOT NULL,
  PRIMARY KEY (`id_pend`),
  CONSTRAINT `id_pend_fk` FOREIGN KEY (`id_pend`) REFERENCES `tweb_penduduk` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Table: tweb_penduduk_map
CREATE TABLE `tweb_penduduk_map` (
  `id` int NOT NULL,
  `lat` varchar(24) NOT NULL,
  `lng` varchar(24) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- Table: tweb_penduduk_pekerjaan
CREATE TABLE `tweb_penduduk_pekerjaan` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=90 DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_pendidikan
CREATE TABLE `tweb_penduduk_pendidikan` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_pendidikan_kk
CREATE TABLE `tweb_penduduk_pendidikan_kk` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_sex
CREATE TABLE `tweb_penduduk_sex` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_penduduk_status
CREATE TABLE `tweb_penduduk_status` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_penduduk_umur
CREATE TABLE `tweb_penduduk_umur` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(25) DEFAULT NULL,
  `dari` int DEFAULT NULL,
  `sampai` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_penduduk_warganegara
CREATE TABLE `tweb_penduduk_warganegara` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(25) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_rtm
CREATE TABLE `tweb_rtm` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nik_kepala` int NOT NULL,
  `no_kk` varchar(20) NOT NULL,
  `tgl_daftar` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `kelas_sosial` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_rtm_hubungan
CREATE TABLE `tweb_rtm_hubungan` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `nama` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_sakit_menahun
CREATE TABLE `tweb_sakit_menahun` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_status_dasar
CREATE TABLE `tweb_status_dasar` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_status_ktp
CREATE TABLE `tweb_status_ktp` (
  `id` tinyint NOT NULL AUTO_INCREMENT,
  `nama` varchar(50) NOT NULL,
  `ktp_el` tinyint NOT NULL,
  `status_rekam` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb3 ROW_FORMAT=DYNAMIC;

-- Table: tweb_surat_atribut
CREATE TABLE `tweb_surat_atribut` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_surat` int NOT NULL,
  `id_tipe` tinyint NOT NULL,
  `nama` varchar(40) NOT NULL,
  `long` tinyint NOT NULL,
  `kode` tinyint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- Table: tweb_surat_format
CREATE TABLE `tweb_surat_format` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  `url_surat` varchar(100) NOT NULL,
  `kode_surat` varchar(10) NOT NULL,
  `lampiran` varchar(100) DEFAULT NULL,
  `kunci` tinyint(1) NOT NULL DEFAULT '0',
  `favorit` tinyint(1) NOT NULL DEFAULT '0',
  `jenis` tinyint NOT NULL DEFAULT '2',
  PRIMARY KEY (`id`),
  UNIQUE KEY `url_surat` (`url_surat`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb3;

-- Table: tweb_wil_clusterdesa
CREATE TABLE `tweb_wil_clusterdesa` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rt` varchar(10) NOT NULL DEFAULT '0',
  `rw` varchar(10) NOT NULL DEFAULT '0',
  `dusun` varchar(50) NOT NULL DEFAULT '0',
  `id_kepala` int NOT NULL,
  `lat` varchar(20) NOT NULL,
  `lng` varchar(20) NOT NULL,
  `zoom` int NOT NULL,
  `path` text NOT NULL,
  `map_tipe` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `rt` (`rt`,`rw`,`dusun`),
  KEY `id_kepala` (`id_kepala`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=latin1;

-- Table: user
CREATE TABLE `user` (
  `id` mediumint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `id_grup` int NOT NULL,
  `email` varchar(100) NOT NULL,
  `last_login` datetime NOT NULL,
  `active` tinyint unsigned DEFAULT '0',
  `nama` varchar(50) DEFAULT NULL,
  `company` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `foto` varchar(100) NOT NULL,
  `session` varchar(40) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb3;

-- Table: user_grup
CREATE TABLE `user_grup` (
  `id` tinyint NOT NULL,
  `nama` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

-- Table: widget
CREATE TABLE `widget` (
  `id` int NOT NULL AUTO_INCREMENT,
  `isi` text,
  `enabled` int DEFAULT NULL,
  `judul` varchar(100) DEFAULT NULL,
  `jenis_widget` tinyint NOT NULL DEFAULT '3',
  `urut` int DEFAULT NULL,
  `form_admin` varchar(100) NOT NULL,
  `setting` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=latin1;

SET FOREIGN_KEY_CHECKS = 1;
