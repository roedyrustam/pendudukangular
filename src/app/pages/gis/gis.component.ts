import { Component, OnInit, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { Resident, Inventory } from '../../models/data.models';
import * as L from 'leaflet';

@Component({
  selector: 'app-gis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="gis-page fade-in">
      <header class="page-header mb-8">
        <div>
          <h1 class="text-black font-black text-4xl tracking-tighter">SISTEM INFORMASI GEOGRAFIS (GIS)</h1>
          <p class="text-slate-500 font-bold uppercase text-xs tracking-widest mt-1">Pemetaan Sebaran Penduduk & Aset Desa</p>
        </div>
      </header>

      <div class="mapping-grid grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Sidebar Controls -->
        <div class="lg:col-span-1 space-y-6">
          <div class="card-luxury p-6 bg-white border border-slate-100">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Legend & Filter</h3>
            
            <div class="space-y-3">
              <div class="legend-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer" 
                   (click)="toggleLayer('residents')">
                <div class="marker-dot bg-blue-600"></div>
                <span class="text-sm font-bold text-slate-700">Sebaran Penduduk</span>
              </div>
              
              <div class="legend-item flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                   (click)="toggleLayer('inventory')">
                <div class="marker-dot bg-amber-500"></div>
                <span class="text-sm font-bold text-slate-700">Inventaris Aset</span>
              </div>
            </div>
          </div>

          <div class="card-luxury p-6 bg-slate-900 text-white">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Statistik Wilayah</h3>
            <div class="space-y-4">
              <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga Terpetakan</span>
                <div class="text-2xl font-black">{{ mappedResidents().length }}</div>
              </div>
              <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aset Terpetakan</span>
                <div class="text-2xl font-black text-amber-400">{{ mappedInventory().length }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Map Container -->
        <div class="lg:col-span-3">
          <div class="card-luxury overflow-hidden relative border border-slate-100" style="height: 600px;">
            <div id="map" class="w-full h-full"></div>
            
            <!-- Map Overlay Controls -->
            <div class="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
               <button (click)="resetView()" class="p-3 bg-white border border-slate-200 rounded-xl shadow-lg hover:bg-slate-50 transition-all font-black text-xs">
                 RECENTER 🧭
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .gis-page { padding-bottom: 3rem; }
    #map { background: #f8fafc; cursor: crosshair; }
    .marker-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .legend-item { transition: 0.2s; }
    
    ::ng-deep .leaflet-popup-content-wrapper {
      border-radius: 1.5rem;
      padding: 0.5rem;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
      border: 1px solid #f1f5f9;
    }
    ::ng-deep .leaflet-popup-content {
      font-family: 'Inter', sans-serif;
      margin: 1rem;
    }
    ::ng-deep .leaflet-container {
      font-family: 'Inter', sans-serif !important;
    }
  `]
})
export class GisComponent implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private map!: L.Map;
  
  mappedResidents = signal<Resident[]>([]);
  mappedInventory = signal<Inventory[]>([]);
  
  residentMarkers: L.Marker[] = [];
  inventoryMarkers: L.Marker[] = [];

  ngOnInit() {
    this.initMap();
    this.loadData();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap() {
    // Default to a central point (can be village center)
    this.map = L.map('map', {
      center: [-7.5, 110.5], // Default Indonesia centralish
      zoom: 13,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Modern Light Map Tiles (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.map);
  }

  private loadData() {
    // Load residents with coordinates
    this.dataService.getResidents().subscribe(res => {
      const withCoords = res.filter(r => (r as any).latitude && (r as any).longitude);
      this.mappedResidents.set(withCoords as any);
      this.renderMarkers('residents', withCoords);
    });

    // Load inventory with coordinates
    this.dataService.getInventory().subscribe(items => {
      const withCoords = items.filter(i => (i as any).latitude && (i as any).longitude);
      this.mappedInventory.set(withCoords as any);
      this.renderMarkers('inventory', withCoords);
    });
  }

  private renderMarkers(type: 'residents' | 'inventory', data: any[]) {
    // Clear existing
    if (type === 'residents') {
      this.residentMarkers.forEach(m => m.remove());
      this.residentMarkers = [];
    } else {
      this.inventoryMarkers.forEach(m => m.remove());
      this.inventoryMarkers = [];
    }

    data.forEach(item => {
      const color = type === 'residents' ? '#2563eb' : '#f59e0b';
      const markerHtml = `<div style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.3);"></div>`;
      
      const icon = L.divIcon({
        className: 'custom-marker',
        html: markerHtml,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      const popupHtml = `
        <div class="p-2">
          <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">${type === 'residents' ? 'PENDUDUK' : 'ASET DESA'}</div>
          <div class="text-sm font-black text-slate-900 mb-1">${item.full_name || item.item_name}</div>
          <div class="text-[10px] text-slate-500 font-bold">${item.address || item.location || '-'}</div>
          <hr class="my-2 border-slate-100">
          <button class="text-blue-600 font-black text-[10px] uppercase tracking-widest">Detail Selengkapnya ➜</button>
        </div>
      `;

      const marker = L.marker([item.latitude, item.longitude], { icon })
        .bindPopup(popupHtml)
        .addTo(this.map);

      if (type === 'residents') this.residentMarkers.push(marker);
      else this.inventoryMarkers.push(marker);
    });

    // Auto-fit map if we have data
    const allMarkers = [...this.residentMarkers, ...this.inventoryMarkers];
    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  resetView() {
    const allMarkers = [...this.residentMarkers, ...this.inventoryMarkers];
    if (allMarkers.length > 0) {
      const group = L.featureGroup(allMarkers);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  toggleLayer(type: 'residents' | 'inventory') {
    const markers = type === 'residents' ? this.residentMarkers : this.inventoryMarkers;
    markers.forEach(m => {
      if (this.map.hasLayer(m)) m.remove();
      else m.addTo(this.map);
    });
  }
}
