import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Resident, ServiceRequest } from '../../models/data.models';

@Component({
  selector: 'app-verify',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verify.html'
})
export class Verify implements OnInit {
  private route = inject(ActivatedRoute);
  private dataService = inject(DataService);

  request = signal<ServiceRequest | null>(null);
  resident = signal<Resident | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID Dokumen tidak valid.');
      this.loading.set(false);
      return;
    }

    try {
      const dbReq = await this.dataService.getRequestById(id);
      if (!dbReq) {
        this.error.set('Dokumen tidak ditemukan dalam sistem.');
        this.loading.set(false);
        return;
      }
      
      this.request.set(dbReq);

      // Ambil detail warga untuk verifikasi nama
      const dbRes = await this.dataService.getResidentByNikSync(dbReq.nik);
      if (dbRes) {
        this.resident.set(dbRes);
      } else {
        this.error.set('Data kependudukan tidak cocok dengan dokumen.');
      }
    } catch (err) {
      this.error.set('Terjadi kesalahan saat memverifikasi dokumen.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }
}
