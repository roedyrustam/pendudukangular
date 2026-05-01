import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="import-container fade-in">
      <header class="mb-8">
        <h2 class="title-gradient">Migrasi Data (MySQL Import)</h2>
        <p class="text-muted">Impor data kependudukan dari file SQL MySQL (OpenSID atau sejenisnya).</p>
      </header>

      <div class="import-card card-luxury glass-panel p-8">
        <div class="upload-section" [class.dragging]="isDragging()" 
          (dragover)="onDragOver($event)" (dragleave)="onDragLeave()" (drop)="onDrop($event)">
          <div class="icon">📦</div>
          <h3>Pilih atau Taruh File .sql</h3>
          <p class="text-sm text-muted">Format yang didukung: MySQL Dump (.sql)</p>
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".sql" hidden>
          <button class="btn-primary mt-4" (click)="fileInput.click()">Pilih File SQL</button>
        </div>

        <div *ngIf="fileName()" class="file-info mt-6 p-4 glass-panel flex-between">
           <div class="flex items-center gap-3">
              <span class="text-2xl">📄</span>
              <div>
                 <p class="font-bold">{{ fileName() }}</p>
                 <p class="text-xs text-muted">{{ fileSize() }} bytes</p>
              </div>
           </div>
           <button class="btn-text" (click)="resetFile()">Ganti File</button>
        </div>

        <div class="mapping-section mt-8" *ngIf="sqlContent()">
           <h4>Pratinjau & Konfigurasi Impor</h4>
           <p class="text-xs text-muted mb-4">Sistem akan mengekstrak data dari pernyataan INSERT INTO.</p>
                      <div class="table-selector flex gap-4 mb-6">
               <div class="input-group">
                  <label>Mode Impor</label>
                  <select [(ngModel)]="importMode" class="custom-select">
                     <option value="single">Tabel Tunggal</option>
                     <option value="relational">Relasional (Keluarga + Penduduk)</option>
                  </select>
               </div>
               <div class="input-group" *ngIf="importMode === 'single'">
                  <label>Target Tabel</label>
                  <select [(ngModel)]="targetTable" class="custom-select">
                     <option value="residents">Penduduk (residents)</option>
                     <option value="families">Keluarga (families)</option>
                     <option value="articles">Artikel/Berita (articles)</option>
                  </select>
               </div>
               <div class="input-group" *ngIf="importMode === 'single'">
                  <label>Nama Tabel di SQL</label>
                  <input [(ngModel)]="sqlTableName" class="custom-input" placeholder="tweb_penduduk">
               </div>
               <div class="input-group" *ngIf="importMode === 'relational'">
                  <label>Status Deteksi</label>
                  <div class="flex gap-2 mt-2">
                     <span class="badge" [class.success]="detectedTables().includes('tweb_keluarga')">KK: {{ detectedTables().includes('tweb_keluarga') ? 'OK' : 'No' }}</span>
                     <span class="badge" [class.success]="detectedTables().includes('tweb_penduduk')">Warga: {{ detectedTables().includes('tweb_penduduk') ? 'OK' : 'No' }}</span>
                  </div>
               </div>
            </div>

           <div class="logs-area card-luxury bg-black p-4 mb-6">
              <div class="flex-between mb-2">
                 <span class="text-xs text-primary font-bold">LOG PARSING</span>
                 <span class="text-xs">{{ logs().length }} baris terdeteksi</span>
              </div>
              <div class="log-lines">
                 <div *ngFor="let log of logs()" class="log-line" [class.error]="log.includes('ERROR')">{{ log }}</div>
                 <div *ngIf="logs().length === 0" class="text-muted text-xs italic">Menunggu parsing...</div>
              </div>
           </div>

           <!-- RLS Helper -->
           <div class="rls-helper card-luxury mb-6 p-4 border-warning" *ngIf="showRLSHelper()">
              <div class="flex-between mb-2">
                 <span class="text-xs text-warning font-bold">⚠️ PERBAIKAN RLS DIPERLUKAN</span>
                 <button class="btn-text-sm" (click)="copyRLSSql()">Salin SQL</button>
              </div>
              <p class="text-xs mb-3">Jalankan perintah ini di Supabase SQL Editor untuk mengizinkan impor data:</p>
              <pre class="sql-code">ALTER TABLE public.{{ targetTable }} DISABLE ROW LEVEL SECURITY;</pre>
           </div>

           <div class="actions flex gap-3">
              <button class="btn-primary" [disabled]="isProcessing() || !sqlContent()" (click)="startMigration()">
                 🚀 {{ isProcessing() ? 'Memproses Migrasi...' : 'Mulai Impor ke Supabase' }}
              </button>
              <button class="btn-outline" (click)="parseSQL()" [disabled]="isProcessing()">
                 🔍 Analisis SQL
              </button>
           </div>
        </div>
      </div>

      <div *ngIf="showSuccess()" class="toast-success glass-panel">
         <span>✅</span>
         <p>Migrasi Berhasil! {{ successCount() }} data telah diimpor.</p>
      </div>
    </div>
  `,
  styles: [`
    .upload-section {
       border: 2px dashed var(--border-color);
       padding: 3rem;
       text-align: center;
       border-radius: 1rem;
       transition: all 0.3s;
       &.dragging { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
       .icon { font-size: 3rem; margin-bottom: 1rem; }
    }
    .log-lines {
       height: 150px;
       overflow-y: auto;
       font-family: monospace;
       font-size: 0.7rem;
       color: #10b981;
    }
    .log-line { margin-bottom: 2px; &.error { color: #f87171; } }
    .sql-code { background: #000; padding: 0.5rem; border-radius: 0.25rem; font-size: 0.7rem; color: #a5b4fc; }
    .badge {
       padding: 0.2rem 0.6rem; border-radius: 1rem; font-size: 0.7rem; background: rgba(255,255,255,0.1);
       &.success { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
    }
    .border-warning { border: 1px solid rgba(245, 158, 11, 0.3); }
    .text-warning { color: #f59e0b; }
    .custom-select, .custom-input {
       background: rgba(255,255,255,0.05);
       border: 1px solid var(--border-color);
       color: white;
       padding: 0.5rem 1rem;
       border-radius: 0.5rem;
       width: 100%;
       outline: none;
       &:focus { border-color: var(--primary); }
    }
    .input-group { flex: 1; label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; } }
    .flex { display: flex; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .items-center { align-items: center; }
    .toast-success {
       position: fixed; bottom: 2rem; right: 2rem; display: flex; align-items: center; gap: 1rem; padding: 1rem 2rem; border-radius: 1rem; border: 1px solid #10b981; background: rgba(16, 185, 129, 0.1); backdrop-filter: blur(10px); animation: slideUp 0.3s ease;
    }
  `]
})
export class ImportComponent {
  private dataService = inject(DataService);

  fileName = signal('');
  fileSize = signal(0);
  sqlContent = signal('');
  logs = signal<string[]>([]);
  isDragging = signal(false);
  isProcessing = signal(false);
  showSuccess = signal(false);
  showRLSHelper = signal(false);
  successCount = signal(0);
  detectedTables = signal<string[]>([]);
  importMode: 'single' | 'relational' = 'relational';

  targetTable = 'residents';
  sqlTableName = 'tweb_penduduk';

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave() {
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.loadFile(file);
  }

  onFileSelected(e: any) {
    const file = e.target.files[0];
    if (file) this.loadFile(file);
  }

  loadFile(file: File) {
    this.fileName.set(file.name);
    this.fileSize.set(file.size);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      this.sqlContent.set(content);
      this.addLog('File loaded successfully. Size: ' + file.size + ' bytes');
      this.autoDetectTables(content);
    };
    reader.readAsText(file);
  }

  autoDetectTables(content: string) {
    const found: string[] = [];
    const tables = [
      'tweb_penduduk', 'tweb_keluarga', 'tweb_wil_clusterdesa', 
      'tweb_penduduk_agama', 'tweb_penduduk_pekerjaan', 
      'tweb_penduduk_pendidikan', 'tweb_penduduk_kawin',
      'artikel'
    ];
    
    tables.forEach(t => {
      if (content.includes(`INSERT INTO \`${t}\``) || content.includes(`INSERT INTO ${t}`)) {
        found.push(t);
      }
    });
    
    this.detectedTables.set(found);
    
    if (found.includes('tweb_keluarga') && found.includes('tweb_penduduk')) {
      this.importMode = 'relational';
      this.addLog('✨ Database Sidepe/OpenSID terdeteksi. Mengaktifkan Mode Relasional Otomatis.');
    } else if (found.length > 0) {
      this.importMode = 'single';
      this.sqlTableName = found[0];
      this.targetTable = found[0].includes('penduduk') ? 'residents' : (found[0].includes('keluarga') ? 'families' : 'articles');
      this.addLog(`✨ Terdeteksi tabel: ${found[0]}`);
    }
  }

  resetFile() {
    this.fileName.set('');
    this.sqlContent.set('');
    this.logs.set([]);
  }

  addLog(msg: string) {
    this.logs.set([...this.logs(), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }

  parseSQL(tableName?: string): any[] {
    const content = this.sqlContent();
    const tableToParse = tableName || this.sqlTableName;
    if (!content) return [];

    const tableRegex = new RegExp(`INSERT INTO \`?${tableToParse}\`?\\s?\\((.*?)\\)\\s?VALUES\\s?(.*?);`, 'gis');
    const matches = [...content.matchAll(tableRegex)];
    
    if (matches.length === 0) {
      this.addLog('⚠️ Tidak ditemukan pernyataan INSERT INTO untuk tabel: ' + tableToParse);
      return [];
    }

    const allData: any[] = [];
    matches.forEach(match => {
      const columns = match[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
      const valuesStr = match[2].trim();
      const valueGroups = valuesStr.split(/\),\s?\(/);
      
      valueGroups.forEach(group => {
        let cleanGroup = group.trim();
        if (cleanGroup.startsWith('(')) cleanGroup = cleanGroup.substring(1);
        if (cleanGroup.endsWith(')')) cleanGroup = cleanGroup.substring(0, cleanGroup.length - 1);
        
        const values = cleanGroup.match(/('.*?'|null|\d+)/g)?.map(v => {
           if (v.toLowerCase() === 'null') return null;
           if (v.startsWith("'") && v.endsWith("'")) return v.substring(1, v.length - 1);
           return isNaN(Number(v)) ? v : Number(v);
        }) || [];

        const obj: any = {};
        columns.forEach((col, idx) => { obj[col] = values[idx]; });
        allData.push(obj);
      });
    });

    this.addLog(`✅ [${tableToParse}] Berhasil mengekstrak ${allData.length} baris.`);
    return allData;
  }

  async startMigration() {
    this.isProcessing.set(true);
    this.addLog('🚀 Memulai migrasi...');

    try {
      if (this.importMode === 'relational') {
        await this.runRelationalMigration();
      } else {
        await this.runSingleTableMigration();
      }
    } catch (err: any) {
      this.addLog('❌ ERROR: ' + err.message);
      if (err.message.includes('row-level security')) this.showRLSHelper.set(true);
      alert('Migrasi gagal: ' + err.message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  async runSingleTableMigration() {
    const data = this.parseSQL();
    if (data.length === 0) throw new Error('Data kosong atau gagal di-parse.');
    const mappedData = data.map(item => this.mapSchema(item, this.targetTable));
    await this.bulkUpsert(this.targetTable, mappedData);
    this.successCount.set(mappedData.length);
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 5000);
  }

  async runRelationalMigration() {
    this.addLog('🔍 Menganalisis seluruh struktur database...');
    
    // 1. Extract all lookup data
    const agamaMap = this.getLookupMap('tweb_penduduk_agama');
    const pekerjaanMap = this.getLookupMap('tweb_penduduk_pekerjaan');
    const pendidikanMap = this.getLookupMap('tweb_penduduk_pendidikan');
    const kawinMap = this.getLookupMap('tweb_penduduk_kawin');
    const clusterData = this.parseSQL('tweb_wil_clusterdesa');
    
    const clusterMap = new Map<number, any>();
    clusterData.forEach(c => clusterMap.set(c.id, c));

    this.addLog('🔄 Step 1: Menyiapkan Data Penduduk...');
    const rawResidents = this.parseSQL('tweb_penduduk');
    const residentNameMap = new Map<string, string>();
    rawResidents.forEach(r => {
      const nikStr = String(r.nik).replace('.0', '');
      residentNameMap.set(nikStr, r.nama);
    });

    this.addLog('🔄 Step 2: Mengimpor Data Keluarga & Wilayah...');
    const rawFamilies = this.parseSQL('tweb_keluarga');
    const mappedFamilies = rawFamilies.map(f => {
      const cluster = clusterMap.get(f.id_cluster);
      const rt = cluster?.rt || f.rt || '00';
      const rw = cluster?.rw || f.rw || '00';
      
      // Resolve head of family name if possible
      let headName = f.nama_kepala || 'Kepala Keluarga';
      if (f.nik_kepala && residentNameMap.has(String(f.nik_kepala))) {
        headName = residentNameMap.get(String(f.nik_kepala)) || headName;
      }

      return {
        kk_number: String(f.no_kk || f.kk_number).replace('.0', ''),
        head_of_family_name: headName,
        address: f.alamat || 'Alamat tidak tersedia',
        rt: rt,
        rw: rw,
        rt_rw: `RT ${rt}/RW ${rw}`,
        hamlet: cluster?.dusun || f.dusun || '',
        district: 'Kecamatan',
        social_class: this.mapSocialClass(f.kelas_sosial),
        created_at: new Date().toISOString()
      };
    });
    
    await this.bulkUpsert('families', mappedFamilies);
    this.addLog(`✅ ${mappedFamilies.length} Keluarga terimpor.`);

    this.addLog('🔄 Step 3: Menyiapkan Mapping ID -> No KK...');
    const idToKkMap = new Map<string | number, string>();
    rawFamilies.forEach(f => {
      if (f.id && (f.no_kk || f.kk_number)) idToKkMap.set(f.id, String(f.no_kk || f.kk_number).replace('.0', ''));
    });

    this.addLog('🔄 Step 4: Mengimpor Data Penduduk (Resolving Relasi)...');
    const mappedResidents = rawResidents.map(r => {
      return {
        nik: String(r.nik).replace('.0', ''),
        full_name: r.nama || r.full_name,
        birth_place: r.tempatlahir || r.birth_place,
        birth_date: r.tanggallahir || r.birth_date,
        gender: (r.sex === '1' || r.sex === 1) ? 'Laki-laki' : 'Perempuan',
        religion: agamaMap.get(r.agama_id) || 'Islam',
        education: pendidikanMap.get(r.pendidikan_kk_id) || 'SMA/Sederajat',
        occupation: pekerjaanMap.get(r.pekerjaan_id) || 'Tidak Bekerja',
        marital_status: kawinMap.get(r.status_kawin) || 'Belum Kawin',
        family_id: idToKkMap.get(r.id_kk) || null,
        relationship: r.kk_level === '1' ? 'Kepala Keluarga' : 'Anggota',
        father_name: r.nama_ayah || '-',
        mother_name: r.nama_ibu || '-',
        address: r.alamat_sekarang || r.alamat,
        citizenship: (r.warganegara_id === '1' || r.warganegara_id === 1) ? 'WNI' : 'WNA',
        blood_type: this.mapBloodType(r.golongan_darah_id),
        status_dasar: (r.status_dasar === '1' || r.status_dasar === 1) ? 'HIDUP' : 'MATI',
        created_at: new Date().toISOString()
      };
    });

    await this.bulkUpsert('residents', mappedResidents);
    this.addLog(`✅ ${mappedResidents.length} Penduduk terimpor.`);
    
    this.successCount.set(mappedFamilies.length + mappedResidents.length);
    this.showSuccess.set(true);
    setTimeout(() => this.showSuccess.set(false), 5000);
  }

  private getLookupMap(tableName: string): Map<number, string> {
    const data = this.parseSQL(tableName);
    const map = new Map<number, string>();
    data.forEach(item => {
      if (item.id && item.nama) map.set(item.id, item.nama);
    });
    return map;
  }

  private mapSocialClass(id: any): string {
    const classes: any = { 1: 'Sangat Miskin', 2: 'Miskin', 3: 'Sedang', 4: 'Kaya' };
    return classes[id] || 'Sedang';
  }

  private mapBloodType(id: any): string {
    const types: any = { 1: 'A', 2: 'B', 3: 'AB', 4: 'O', 13: 'Tidak Tahu' };
    return types[id] || '-';
  }

  async bulkUpsert(table: string, data: any[]) {
    // Filter out items with null/undefined keys if necessary
    const validData = data.filter(item => {
       if (table === 'residents') return !!item.nik;
       if (table === 'families') return !!item.kk_number;
       return true;
    });

    const chunkSize = 100;
    for (let i = 0; i < validData.length; i += chunkSize) {
      const chunk = validData.slice(i, i + chunkSize);
      const { error } = await (this.dataService as any).supabase
        .from(table)
        .upsert(chunk);
      if (error) {
        this.addLog(`❌ BATCH ERROR [${table}]: ` + error.message);
        throw error;
      }
      this.addLog(`Progress [${table}]: ${Math.min(i + chunkSize, validData.length)}/${validData.length}...`);
    }
  }

  private mapSchema(item: any, target: string): any {
    if (target === 'residents' || target === 'tweb_penduduk') {
      return {
        nik: item.nik || item.id_pend || item.nik_id,
        full_name: item.nama || item.full_name || item.nama_penduduk,
        birth_place: item.tempatlahir || item.birth_place || item.tempat_lahir,
        birth_date: item.tanggallahir || item.birth_date || item.tgl_lahir,
        gender: (item.sex === '1' || item.sex === 1 || item.gender === 'Laki-laki') ? 'Laki-laki' : 'Perempuan',
        occupation: item.pekerjaan_id || item.occupation || item.pekerjaan,
        family_id: item.no_kk || item.family_id || item.id_kk, // id_kk will be fixed in relational mode
        address: item.alamat || item.address || item.alamat_sekarang,
        status_dasar: item.status_dasar === '1' || item.status_dasar === 1 ? 'HIDUP' : (item.status_dasar === '2' ? 'MATI' : 'HIDUP'),
        created_at: new Date().toISOString()
      };
    }
    if (target === 'families' || target === 'tweb_keluarga') {
      return {
        kk_number: item.no_kk || item.kk_number || item.id_kk,
        head_of_family_name: item.nama_kepala || item.head_of_family_name || item.kepala_keluarga,
        address: item.alamat || item.address || item.alamat_jalan,
        rt: item.rt || '00',
        rw: item.rw || '00',
        district: item.kecamatan || item.district || 'Kecamatan',
        social_class: item.kelas_sosial || 'Sedang',
        created_at: new Date().toISOString()
      };
    }
    return { ...item, created_at: new Date().toISOString() };
  }

  copyRLSSql() {
    const sql = `ALTER TABLE public.${this.targetTable} DISABLE ROW LEVEL SECURITY;`;
    navigator.clipboard.writeText(sql);
    this.addLog('📋 SQL disalin ke clipboard.');
  }
}
