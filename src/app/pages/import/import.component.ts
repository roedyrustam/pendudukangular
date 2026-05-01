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
       border: 2px dashed #e2e8f0;
       padding: 4rem;
       text-align: center;
       border-radius: 2rem;
       background: #f8fafc;
       transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
       cursor: pointer;
       &:hover, &.dragging { border-color: #2563eb; background: #eff6ff; }
       .icon { font-size: 4rem; margin-bottom: 1.5rem; }
       h3 { color: #000000; font-weight: 800; margin-bottom: 0.5rem; }
    }
    .mapping-section {
       h4 { color: #000000; font-weight: 800; margin-bottom: 1.5rem; }
    }
    .log-lines {
       height: 180px;
       overflow-y: auto;
       font-family: 'JetBrains Mono', 'Fira Code', monospace;
       font-size: 0.75rem;
       color: #059669;
       padding: 1rem;
    }
    .log-line { margin-bottom: 4px; &.error { color: #dc2626; font-weight: 600; } }
    .logs-area {
       background: #000000 !important;
       border-radius: 1.5rem;
       box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
    }
    .sql-code { background: #1e293b; padding: 0.75rem; border-radius: 0.75rem; font-size: 0.75rem; color: #cbd5e1; }
    .badge {
       padding: 0.25rem 0.75rem; border-radius: 2rem; font-size: 0.7rem; font-weight: 700; background: #f1f5f9; color: #64748b;
       &.success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    }
    .border-warning { border: 2px solid #fef3c7 !important; background: #fffbeb; }
    .text-warning { color: #b45309; }
    .custom-select, .custom-input {
       background: #f1f5f9;
       border: 2px solid transparent;
       color: #000000;
       font-weight: 600;
       padding: 0.75rem 1rem;
       border-radius: 0.75rem;
       width: 100%;
       outline: none;
       transition: all 0.2s;
       &:focus { border-color: #2563eb; background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
    .input-group { flex: 1; label { display: block; font-size: 0.8rem; font-weight: 700; color: #000000; margin-bottom: 0.5rem; } }
    .flex { display: flex; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .items-center { align-items: center; }
    .toast-success {
       position: fixed; bottom: 2.5rem; right: 2.5rem; display: flex; align-items: center; gap: 1.25rem; 
       padding: 1.25rem 2.5rem; border-radius: 1.5rem; border: 1px solid #bbf7d0; 
       background: white; box-shadow: 0 20px 40px -15px rgba(0,0,0,0.1); 
       animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
       p { color: #000000; font-weight: 700; }
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

    // Improved regex to handle various INSERT styles
    const tableRegex = new RegExp(`INSERT INTO \`?${tableToParse}\`?\\s?\\((.*?)\\)\\s?VALUES\\s?`, 'gi');
    const allData: any[] = [];
    
    let match;
    while ((match = tableRegex.exec(content)) !== null) {
      const columns = match[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
      const startIdx = tableRegex.lastIndex;
      
      // Find the end of this INSERT statement (semicolon)
      let endIdx = content.indexOf(';', startIdx);
      if (endIdx === -1) endIdx = content.length;
      
      const valuesContent = content.substring(startIdx, endIdx).trim();
      
      // Advanced value parser handling commas inside quotes
      const rows = this.splitSqlRows(valuesContent);
      
      rows.forEach(row => {
        const values = this.splitSqlValues(row);
        const obj: any = {};
        columns.forEach((col, idx) => {
          let val: any = values[idx];
          // Basic sanitization
          if (val === 'NULL' || val === 'null' || val === undefined) {
            val = null;
          } else if (val.startsWith("'") && val.endsWith("'")) {
            val = val.substring(1, val.length - 1).replace(/''/g, "'"); // Handle escaped quotes
          } else if (!isNaN(Number(val)) && val.trim() !== '') {
            val = Number(val);
          }
          obj[col] = val;
        });
        allData.push(obj);
      });
    }

    if (allData.length === 0) {
      this.addLog('⚠️ Tidak ditemukan data untuk tabel: ' + tableToParse);
    } else {
      this.addLog(`✅ [${tableToParse}] Berhasil mengekstrak ${allData.length} baris.`);
    }
    return allData;
  }

  // Split rows by ),( while ignoring commas inside quotes
  private splitSqlRows(content: string): string[] {
    const rows: string[] = [];
    let current = '';
    let inQuotes = false;
    let parenDepth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === "'" && content[i-1] !== '\\') inQuotes = !inQuotes;
      
      if (!inQuotes) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
      }

      if (char === ',' && parenDepth === 0 && !inQuotes) {
        rows.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) rows.push(current.trim());
    
    // Clean up wrapping parentheses
    return rows.map(r => {
      let res = r.trim();
      if (res.startsWith('(')) res = res.substring(1);
      if (res.endsWith(')')) res = res.substring(0, res.length - 1);
      return res;
    });
  }

  // Split values by comma while ignoring commas inside quotes
  private splitSqlValues(row: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === "'" && (i === 0 || row[i-1] !== '\\')) {
         // Check for escaped quotes like '' in SQL
         if (inQuotes && row[i+1] === "'") {
           current += "''";
           i++;
           continue;
         }
         inQuotes = !inQuotes;
      }
      
      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }

  private sanitizeDate(dateStr: any): string | null {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    
    // Catch MySQL 'zero' dates and years starting with 0000
    if (str.startsWith('0000') || str === 'NULL' || str === 'null') {
      return null;
    }
    
    const d = new Date(str);
    if (isNaN(d.getTime())) return null;
    
    // PostgreSQL safe range (roughly 1800+ for practical resident data)
    if (d.getFullYear() < 1800) return null;
    
    return str;
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
    const residentIdMap = new Map<any, string>();
    const residentNikMap = new Map<string, string>();
    
    rawResidents.forEach(r => {
      const nikStr = String(r.nik).replace('.0', '');
      if (r.nama) {
        residentIdMap.set(r.id, r.nama);
        residentNikMap.set(nikStr, r.nama);
      }
    });

    this.addLog('🔄 Step 2: Mengimpor Data Keluarga & Wilayah...');
    const rawFamilies = this.parseSQL('tweb_keluarga');
    const mappedFamilies = rawFamilies.map(f => {
      const cluster = clusterMap.get(f.id_cluster);
      const rt = cluster?.rt || f.rt || '00';
      const rw = cluster?.rw || f.rw || '00';
      
      // Multi-step name resolution for Head of Family
      let headName = f.nama_kepala;
      
      // Try resolving by internal ID (Common in OpenSID/Sidepe)
      if (!headName && f.nik_kepala) {
        headName = residentIdMap.get(f.nik_kepala) || residentIdMap.get(Number(f.nik_kepala));
      }
      
      // Try resolving by NIK string
      if (!headName && f.nik_kepala) {
        headName = residentNikMap.get(String(f.nik_kepala).replace('.0', ''));
      }

      return {
        kk_number: String(f.no_kk || f.kk_number || '0000000000000000').replace('.0', ''),
        head_of_family_name: headName || 'Kepala Keluarga (Data Migrasi)',
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
      const kk = String(f.no_kk || f.kk_number || '').replace('.0', '');
      if (f.id && kk) idToKkMap.set(f.id, kk);
    });

    this.addLog('🔄 Step 4: Mengimpor Data Penduduk (Resolving Relasi)...');
    const mappedResidents = rawResidents.map(r => {
      const nik = String(r.nik).replace('.0', '');
      return {
        nik: nik,
        full_name: r.nama || 'Warga Tanpa Nama',
        birth_place: r.tempatlahir || r.birth_place || '-',
        birth_date: this.sanitizeDate(r.tanggallahir || r.birth_date),
        gender: (r.sex === '1' || r.sex === 1) ? 'Laki-laki' : 'Perempuan',
        religion: agamaMap.get(r.agama_id) || 'Islam',
        education: pendidikanMap.get(r.pendidikan_kk_id) || 'SMA/Sederajat',
        occupation: pekerjaanMap.get(r.pekerjaan_id) || 'Tidak Bekerja',
        marital_status: kawinMap.get(r.status_kawin) || 'Belum Kawin',
        family_id: idToKkMap.get(r.id_kk) || null,
        relationship: (r.kk_level === '1' || r.kk_level === 1) ? 'Kepala Keluarga' : 'Anggota',
        father_name: r.nama_ayah || '-',
        mother_name: r.nama_ibu || '-',
        address: r.alamat_sekarang || r.alamat || '-',
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
