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
                 <label>Target Tabel</label>
                 <select [(ngModel)]="targetTable" class="custom-select">
                    <option value="residents">Penduduk (residents)</option>
                    <option value="families">Keluarga (families)</option>
                    <option value="articles">Artikel/Berita (articles)</option>
                 </select>
              </div>
              <div class="input-group">
                 <label>Nama Tabel di SQL</label>
                 <input [(ngModel)]="sqlTableName" class="custom-input" placeholder="tweb_penduduk">
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
      this.autoDetectTable(content);
    };
    reader.readAsText(file);
  }

  autoDetectTable(content: string) {
    if (content.includes('INSERT INTO `tweb_penduduk`')) {
      this.targetTable = 'residents';
      this.sqlTableName = 'tweb_penduduk';
      this.addLog('✨ Auto-detected: Penduduk (tweb_penduduk)');
    } else if (content.includes('INSERT INTO `tweb_keluarga`')) {
      this.targetTable = 'families';
      this.sqlTableName = 'tweb_keluarga';
      this.addLog('✨ Auto-detected: Keluarga (tweb_keluarga)');
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

  parseSQL(): any[] {
    const content = this.sqlContent();
    if (!content) return [];

    // Simple regex to find INSERT INTO statements
    // Example: INSERT INTO `tweb_penduduk` (`nik`, `nama`) VALUES ('123', 'Budi'), ('456', 'Siti');
    const tableRegex = new RegExp(`INSERT INTO \`?${this.sqlTableName}\`?\\s?\\((.*?)\\)\\s?VALUES\\s?(.*?);`, 'gis');
    const matches = [...content.matchAll(tableRegex)];
    
    if (matches.length === 0) {
      this.addLog('⚠️ Tidak ditemukan pernyataan INSERT INTO untuk tabel: ' + this.sqlTableName);
      return [];
    }

    const allData: any[] = [];

    matches.forEach(match => {
      const columns = match[1].split(',').map(c => c.trim().replace(/[`"]/g, ''));
      const valuesStr = match[2].trim();
      
      // Split values groups (group1), (group2)
      // This is complex because values might contain commas inside strings
      // We use a simple strategy: split by '), ('
      const valueGroups = valuesStr.split(/\),\s?\(/);
      
      valueGroups.forEach(group => {
        let cleanGroup = group.trim();
        if (cleanGroup.startsWith('(')) cleanGroup = cleanGroup.substring(1);
        if (cleanGroup.endsWith(')')) cleanGroup = cleanGroup.substring(0, cleanGroup.length - 1);
        
        // Split individual values (handling quoted strings)
        // Regex for CSV-like values: 'val1', 'val2', 3
        const values = cleanGroup.match(/('.*?'|null|\d+)/g)?.map(v => {
           if (v.toLowerCase() === 'null') return null;
           if (v.startsWith("'") && v.endsWith("'")) return v.substring(1, v.length - 1);
           return isNaN(Number(v)) ? v : Number(v);
        }) || [];

        const obj: any = {};
        columns.forEach((col, idx) => {
           obj[col] = values[idx];
        });
        allData.push(obj);
      });
    });

    this.addLog(`✅ Berhasil mengekstrak ${allData.length} baris data.`);
    return allData;
  }

  async startMigration() {
    this.isProcessing.set(true);
    this.addLog('🚀 Memulai migrasi ke Supabase...');

    try {
      const data = this.parseSQL();
      if (data.length === 0) throw new Error('Data kosong atau gagal di-parse.');

      // Map MySQL columns to Supabase columns if needed
      const mappedData = data.map(item => this.mapSchema(item));

      // Bulk Insert (Chunking to avoid payload limit)
      const chunkSize = 100;
      let totalImported = 0;

      for (let i = 0; i < mappedData.length; i += chunkSize) {
        const chunk = mappedData.slice(i, i + chunkSize);
        const { error } = await (this.dataService as any).supabase
          .from(this.targetTable)
          .upsert(chunk);
        
        if (error) throw error;
        totalImported += chunk.length;
        this.addLog(`Progress: ${totalImported}/${mappedData.length} terimpor...`);
      }

      this.successCount.set(totalImported);
      this.showSuccess.set(true);
      this.addLog('✨ Migrasi selesai dengan sukses!');
      setTimeout(() => this.showSuccess.set(false), 5000);
    } catch (err: any) {
      this.addLog('❌ ERROR: ' + err.message);
      if (err.message.includes('row-level security')) {
        this.showRLSHelper.set(true);
      }
      alert('Migrasi gagal: ' + err.message);
    } finally {
      this.isProcessing.set(false);
    }
  }

  copyRLSSql() {
    const sql = `ALTER TABLE public.${this.targetTable} DISABLE ROW LEVEL SECURITY;`;
    navigator.clipboard.writeText(sql);
    this.addLog('📋 SQL disalin ke clipboard.');
  }

  private mapSchema(item: any): any {
    if (this.targetTable === 'residents') {
      return {
        nik: item.nik || item.id_pend || item.nik_id,
        full_name: item.nama || item.full_name || item.nama_penduduk,
        birth_place: item.tempatlahir || item.birth_place || item.tempat_lahir,
        birth_date: item.tanggallahir || item.birth_date || item.tgl_lahir,
        gender: (item.sex === '1' || item.sex === 1 || item.gender === 'Laki-laki') ? 'Laki-laki' : 'Perempuan',
        occupation: item.pekerjaan_id || item.occupation || item.pekerjaan,
        family_id: item.id_kk || item.family_id || item.no_kk,
        address: item.alamat || item.address || item.alamat_sekarang,
        status_dasar: item.status_dasar === '1' || item.status_dasar === 1 ? 'HIDUP' : (item.status_dasar === '2' ? 'MATI' : 'HIDUP'),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    if (this.targetTable === 'families') {
      return {
        kk_number: item.no_kk || item.kk_number || item.id_kk,
        head_of_family_name: item.nama_kepala || item.head_of_family_name || item.kepala_keluarga,
        address: item.alamat || item.address || item.alamat_jalan,
        rt: item.rt || '00',
        rw: item.rw || '00',
        district: item.kecamatan || item.district || 'Kecamatan',
        social_class: item.kelas_sosial || 'Sedang',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    return { ...item, created_at: new Date().toISOString() };
  }
}
