import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { InventoryItem } from '../../models/data.models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="inventory-container fade-in">
      <header class="header-actions mb-10 flex-between items-end">
        <div class="titles">
          <h2 class="title-gradient">Manajemen Aset & Inventaris Desa</h2>
          <p class="text-muted">Pantau kondisi, lokasi, dan nilai aset milik pemerintah desa secara real-time.</p>
          <div class="flex gap-3 mt-6">
            <button class="btn-primary" (click)="openAddModal()" aria-label="Tambah Aset Baru">
              Tambah Aset Baru 📦
            </button>
            <div class="search-box">
               <span class="icon">🔍</span>
               <input [(ngModel)]="searchTerm" placeholder="Cari aset..." class="search-input">
            </div>
          </div>
        </div>
        
        <div class="summary-pills flex gap-3">
           <div class="pill azure">
              <span class="label">Total Aset</span>
              <span class="count">{{ items().length }}</span>
           </div>
           <div class="pill gold">
              <span class="label">Total Nilai</span>
              <span class="count">Rp {{ totalValue() | number }}</span>
           </div>
        </div>
      </header>

      <!-- Inventory Grid -->
      <main class="inventory-grid" aria-label="Daftar Inventaris Desa">
        <article *ngFor="let item of filteredItems()" class="card-luxury p-0 overflow-hidden item-card">
          <div class="condition-badge" [attr.data-status]="item.condition">
             <span class="dot"></span>
             {{ item.condition }}
          </div>
          
          <figure class="item-visual">
            <img [src]="item.image_url || 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=2000&auto=format&fit=crop'" alt="Visual Aset">
            <div class="category-tag">{{ item.category }}</div>
          </figure>

          <section class="item-details p-6">
            <div class="flex justify-between items-start mb-3">
               <div>
                  <span class="text-[10px] font-extrabold text-primary tracking-widest uppercase">{{ item.item_code }}</span>
                  <h3 class="text-slate-900 font-extrabold text-lg mt-1">{{ item.item_name }}</h3>
               </div>
               <div class="year-stamp">
                  {{ item.procurement_year || '2024' }}
               </div>
            </div>
            
            <p class="text-xs text-slate-500 font-bold mb-6 flex items-center gap-2">
               <span class="text-primary">📍</span> {{ item.location || 'Gudang Utama' }}
            </p>
            
            <div class="metrics-grid grid grid-cols-2 gap-4 mb-6">
              <div class="metric-box bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span class="m-label">KUANTITAS</span>
                <span class="m-val text-slate-900">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div class="metric-box bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span class="m-label">NILAI ASET</span>
                <span class="m-val text-primary">Rp {{ item.price | number }}</span>
              </div>
            </div>
            
            <footer class="flex gap-2">
              <button class="btn-outline flex-1 py-2 text-sm" (click)="editItem(item)" aria-label="Edit Aset">Edit Aset ✏️</button>
              <button class="btn-icon delete h-[40px] w-[40px]" (click)="deleteItem(item.id)" aria-label="Hapus Aset">🗑️</button>
            </footer>
          </section>
        </article>

        <!-- Empty State -->
        <section *ngIf="filteredItems().length === 0" class="col-span-full py-20 text-center card-luxury border-dashed">
           <div class="text-5xl mb-4">📦</div>
           <h4 class="text-slate-800 font-bold">Data aset tidak ditemukan</h4>
           <p class="text-muted">Coba ubah kata kunci pencarian Anda.</p>
        </section>
      </main>

      <!-- Add/Edit Modal -->
      <div *ngIf="isModalOpen()" class="form-overlay fade-in" (click)="isModalOpen.set(false)">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <header class="modal-header mb-10">
            <h2 class="title-gradient text-3xl">{{ isEditing() ? 'Edit' : 'Tambah' }} Aset Desa</h2>
            <p class="text-muted">Pastikan data sesuai dengan buku inventaris fisik desa.</p>
          </header>
          
          <form (submit)="saveItem()" class="grid grid-cols-2 gap-6">
            <div class="input-group">
              <label>Kode Barang (Label Inventaris)</label>
              <input [(ngModel)]="itemForm.item_code" name="code" placeholder="AST-001" required class="custom-input">
            </div>
            <div class="input-group">
              <label>Nama Barang / Aset</label>
              <input [(ngModel)]="itemForm.item_name" name="name" placeholder="Contoh: Laptop Acer" required class="custom-input">
            </div>
            
            <div class="input-group">
              <label>Kategori Aset</label>
              <select [(ngModel)]="itemForm.category" name="category" class="custom-select">
                <option value="Elektronik">Elektronik</option>
                <option value="Mebel">Mebel & Peralatan</option>
                <option value="Kendaraan">Kendaraan Dinas</option>
                <option value="Alat Kantor">Alat Tulis Kantor</option>
              </select>
            </div>
            <div class="input-group">
              <label>Kondisi Saat Ini</label>
              <select [(ngModel)]="itemForm.condition" name="condition" class="custom-select">
                <option value="Good">Layak Pakai / Baik</option>
                <option value="Fair">Rusak Ringan / Cukup</option>
                <option value="Damaged">Rusak Berat / Dihapus</option>
              </select>
            </div>
            
            <div class="grid grid-cols-3 gap-4 col-span-2">
               <div class="input-group">
                <label>Jumlah</label>
                <input type="number" [(ngModel)]="itemForm.quantity" name="qty" required class="custom-input">
              </div>
              <div class="input-group">
                <label>Satuan</label>
                <input [(ngModel)]="itemForm.unit" name="unit" placeholder="Pcs/Unit" class="custom-input">
              </div>
              <div class="input-group">
                <label>Tahun Perolehan</label>
                <input type="number" [(ngModel)]="itemForm.procurement_year" name="year" class="custom-input">
              </div>
            </div>

            <div class="input-group col-span-2">
              <label>Nilai Satuan Aset (Rp)</label>
              <input type="number" [(ngModel)]="itemForm.price" name="price" placeholder="0" class="custom-input">
            </div>

            <footer class="form-actions mt-10 col-span-2 flex justify-end gap-3">
              <button type="button" class="btn-outline px-8" (click)="isModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary px-8" [disabled]="loading()">
                {{ loading() ? 'Sedang Menyimpan...' : 'Simpan Perubahan Aset' }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-actions { border-bottom: 1px solid var(--glass-border); padding-bottom: 2rem; }
    .search-box {
       display: flex; align-items: center; gap: 0.75rem; background: #f8fafc;
       border: 1px solid var(--glass-border); padding: 0.5rem 1.25rem; border-radius: 1rem; width: 300px;
       input { background: none; border: none; outline: none; font-weight: 600; font-size: 0.85rem; width: 100%; }
    }
    
    .summary-pills {
       .pill {
          padding: 1rem 1.5rem; border-radius: 1.25rem; display: flex; flex-direction: column; min-width: 150px;
          .label { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; margin-bottom: 0.25rem; }
          .count { font-size: 1.1rem; font-weight: 900; }
          &.azure { background: rgba(37, 99, 235, 0.05); color: var(--primary); }
          &.gold { background: rgba(245, 158, 11, 0.05); color: #b45309; }
       }
    }

    .inventory-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2rem;
    }

    .item-card {
      transition: all 0.4s var(--apple-ease);
      border: 1px solid var(--glass-border);
      &:hover { transform: translateY(-10px); box-shadow: 0 25px 50px -12px rgba(0,0,0,0.1); border-color: var(--primary); }
      
      .condition-badge {
         position: absolute; top: 1rem; right: 1rem; z-index: 10;
         padding: 0.35rem 0.85rem; border-radius: 2rem; font-size: 0.65rem; font-weight: 800;
         text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(8px);
         .dot { width: 6px; height: 6px; border-radius: 50%; }
         &[data-status='Good'] { background: rgba(16, 185, 129, 0.1); color: #059669; .dot { background: #10b981; } }
         &[data-status='Fair'] { background: rgba(245, 158, 11, 0.1); color: #d97706; .dot { background: #f59e0b; } }
         &[data-status='Damaged'] { background: rgba(239, 68, 68, 0.1); color: #dc2626; .dot { background: #ef4444; } }
      }
      
      .item-visual {
        height: 180px; position: relative; overflow: hidden;
        img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .category-tag { position: absolute; bottom: 1rem; left: 1rem; background: rgba(255,255,255,0.9); padding: 0.25rem 0.75rem; border-radius: 0.5rem; font-size: 0.65rem; font-weight: 800; color: #000; }
      }
      &:hover .item-visual img { transform: scale(1.1); }
      
      .year-stamp { background: #f1f5f9; padding: 0.25rem 0.6rem; border-radius: 0.5rem; font-size: 0.7rem; font-weight: 800; color: #64748b; }
      
      .metric-box {
         .m-label { display: block; font-size: 0.55rem; font-weight: 800; color: #94a3b8; margin-bottom: 0.25rem; }
         .m-val { font-size: 0.85rem; font-weight: 800; }
      }
    }

    .form-overlay { position: fixed; inset: 0; background: rgba(241, 245, 249, 0.8); backdrop-filter: blur(15px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .form-card { width: 100%; max-width: 850px; padding: 4rem; }
    
    .custom-input, .custom-select {
       background: #f8fafc; border: 1px solid var(--glass-border); padding: 0.85rem 1.25rem; border-radius: 1rem;
       outline: none; font-weight: 600; font-size: 0.9rem; transition: 0.3s;
       &:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1); }
    }
  `]
})
export class InventoryComponent implements OnInit {
  private dataService = inject(DataService);

  items = signal<InventoryItem[]>([]);
  searchTerm = signal('');
  isModalOpen = signal(false);
  isEditing = signal(false);
  loading = signal(false);

  itemForm: Partial<InventoryItem> = this.resetForm();

  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.items().filter(item => 
      item.item_name.toLowerCase().includes(term) || 
      item.item_code.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  totalValue = computed(() => {
    return this.items().reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
  });

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.dataService.getInventory().subscribe(data => this.items.set(data));
  }

  resetForm(): Partial<InventoryItem> {
    return {
      condition: 'Good',
      quantity: 1,
      unit: 'Unit',
      category: 'Elektronik',
      procurement_year: new Date().getFullYear()
    };
  }

  openAddModal() {
    this.isEditing.set(false);
    this.itemForm = this.resetForm();
    this.isModalOpen.set(true);
  }

  editItem(item: InventoryItem) {
    this.isEditing.set(true);
    this.itemForm = { ...item };
    this.isModalOpen.set(true);
  }

  async saveItem() {
    this.loading.set(true);
    try {
      if (this.isEditing()) {
        await this.dataService.updateInventory(this.itemForm as InventoryItem);
      } else {
        await this.dataService.addInventory(this.itemForm as InventoryItem);
      }
      this.refreshData();
      this.isModalOpen.set(false);
    } catch (err: any) {
      alert('Gagal menyimpan aset: ' + err.message);
    } finally {
      this.loading.set(false);
    }
  }

  async deleteItem(id: string) {
    if (confirm('Hapus aset ini dari daftar?')) {
      await this.dataService.deleteInventory(id);
      this.refreshData();
    }
  }
}
