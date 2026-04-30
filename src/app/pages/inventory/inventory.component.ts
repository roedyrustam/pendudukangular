import { Component, inject, signal, OnInit } from '@angular/core';
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
      <header class="mb-8 flex justify-between items-end">
        <div>
          <h2 class="title-gradient">Manajemen Aset & Inventaris Desa</h2>
          <p class="text-muted">Pantau kondisi, lokasi, dan nilai aset milik pemerintah desa secara real-time.</p>
        </div>
        <button class="btn-primary" (click)="openAddModal()">
          Tambah Aset Baru 📦
        </button>
      </header>

      <!-- Inventory Grid -->
      <div class="inventory-grid">
        <div *ngFor="let item of items()" class="card-luxury glass-panel item-card">
          <div class="item-badge" [class]="item.condition.toLowerCase()">{{ item.condition }}</div>
          <div class="item-image">
            <img [src]="item.image_url || 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?q=80&w=2000&auto=format&fit=crop'" alt="Item">
          </div>
          <div class="p-5">
            <span class="text-xs text-primary font-bold">{{ item.item_code }}</span>
            <h4 class="mb-2 mt-1">{{ item.item_name }}</h4>
            <p class="text-xs text-muted mb-4">📍 {{ item.location || 'Gudang Utama' }}</p>
            
            <div class="flex-between mb-4">
              <div class="qty-info">
                <span class="label">Stok</span>
                <span class="val">{{ item.quantity }} {{ item.unit }}</span>
              </div>
              <div class="price-info text-right">
                <span class="label">Nilai Aset</span>
                <span class="val">Rp {{ item.price | number }}</span>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button class="btn-outline-sm w-full" (click)="editItem(item)">Edit</button>
              <button class="btn-icon delete" (click)="deleteItem(item.id)">🗑️</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="isModalOpen()" class="form-overlay" (click)="isModalOpen.set(false)">
        <div class="form-card card-luxury glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header mb-6">
            <h3 class="title-gradient">{{ isEditing() ? 'Edit' : 'Tambah' }} Aset Desa</h3>
            <p class="text-muted">Masukkan rincian aset atau barang inventaris.</p>
          </div>
          
          <form (submit)="saveItem()">
            <div class="grid-2 mb-4">
              <div class="input-group">
                <label>Kode Barang</label>
                <input [(ngModel)]="itemForm.item_code" name="code" placeholder="AST-001" required>
              </div>
              <div class="input-group">
                <label>Nama Barang</label>
                <input [(ngModel)]="itemForm.item_name" name="name" placeholder="Contoh: Laptop Acer" required>
              </div>
            </div>
            <div class="grid-2 mb-4">
              <div class="input-group">
                <label>Kategori</label>
                <select [(ngModel)]="itemForm.category" name="category">
                  <option value="Elektronik">Elektronik</option>
                  <option value="Mebel">Mebel</option>
                  <option value="Kendaraan">Kendaraan</option>
                  <option value="Alat Kantor">Alat Kantor</option>
                </select>
              </div>
              <div class="input-group">
                <label>Kondisi</label>
                <select [(ngModel)]="itemForm.condition" name="condition">
                  <option value="Good">Baik (Good)</option>
                  <option value="Fair">Cukup (Fair)</option>
                  <option value="Damaged">Rusak (Damaged)</option>
                </select>
              </div>
            </div>
            <div class="grid-3 mb-4">
               <div class="input-group">
                <label>Jumlah</label>
                <input type="number" [(ngModel)]="itemForm.quantity" name="qty" required>
              </div>
              <div class="input-group">
                <label>Satuan</label>
                <input [(ngModel)]="itemForm.unit" name="unit" placeholder="Pcs/Unit/Set">
              </div>
              <div class="input-group">
                <label>Tahun Perolehan</label>
                <input type="number" [(ngModel)]="itemForm.procurement_year" name="year">
              </div>
            </div>
            <div class="input-group mb-6">
              <label>Harga Satuan / Nilai Aset</label>
              <input type="number" [(ngModel)]="itemForm.price" name="price" placeholder="0">
            </div>
            <div class="form-actions mt-8">
              <button type="button" class="btn-text" (click)="isModalOpen.set(false)">Batal</button>
              <button type="submit" class="btn-primary" [disabled]="loading()">
                {{ loading() ? 'Menyimpan...' : 'Simpan Aset' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .inventory-container { padding-bottom: 4rem; }
    .inventory-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .item-card {
      padding: 0;
      overflow: hidden;
      position: relative;
      .item-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.65rem;
        font-weight: 800;
        text-transform: uppercase;
        z-index: 2;
        &.good { background: #10b981; color: white; }
        &.fair { background: #f59e0b; color: white; }
        &.damaged { background: #ef4444; color: white; }
      }
      .item-image {
        height: 160px;
        img { width: 100%; height: 100%; object-fit: cover; opacity: 0.8; }
      }
      h4 { font-size: 1rem; color: #fff; }
      .label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; }
      .val { font-size: 0.9rem; font-weight: 700; color: #fff; }
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .flex-between { display: flex; justify-content: space-between; align-items: center; }
    .btn-icon.delete:hover { border-color: #ef4444; color: #ef4444; }
  `]
})
export class InventoryComponent implements OnInit {
  private dataService = inject(DataService);

  items = signal<InventoryItem[]>([]);
  isModalOpen = signal(false);
  isEditing = signal(false);
  loading = signal(false);

  itemForm: Partial<InventoryItem> = this.resetForm();

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
        await this.dataService.updateInventory(this.itemForm);
      } else {
        await this.dataService.addInventory(this.itemForm);
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
