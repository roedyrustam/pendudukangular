import { Injectable } from '@angular/core';
import { ServiceRequest, Resident } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  /**
   * Mengirim notifikasi WhatsApp ke warga berdasarkan status permohonan.
   */
  sendWhatsAppNotification(request: ServiceRequest, resident: Resident) {
    const phone = this.formatPhoneNumber(resident.phone || '');
    if (!phone) {
      console.warn('Warga tidak memiliki nomor telepon yang valid.');
      return;
    }

    const message = this.getTemplate(request, resident);
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1);
    }
    return cleaned;
  }

  private getTemplate(request: ServiceRequest, resident: Resident): string {
    const greeting = this.getGreeting();
    const villageName = 'Pemerintah Desa Maju Jaya'; // Bisa diambil dari config jika perlu
    
    let body = '';
    
    switch (request.status) {
      case 'Selesai':
        body = `Halo ${resident.full_name},\n\nPermohonan layanan *${request.service_type}* Anda telah *SELESAI* diproses oleh ${villageName}.\n\nAnda dapat mengunduh dokumen resmi digital di tautan berikut:\n${request.letter_url}\n\nTerima kasih atas kerja samanya.`;
        break;
      
      case 'Diproses':
        body = `Halo ${resident.full_name},\n\nPermohonan layanan *${request.service_type}* Anda saat ini sedang *DIPROSES* oleh petugas kami.\n\nKami akan segera mengabari Anda jika dokumen sudah siap. Mohon menunggu.`;
        break;
        
      case 'Ditolak':
        body = `Halo ${resident.full_name},\n\nMohon maaf, permohonan layanan *${request.service_type}* Anda *BELUM DAPAT DISETUJUI*.\n\n*Catatan Petugas:* ${request.admin_note || '-'}\n\nSilakan lengkapi data yang kurang atau hubungi kantor desa untuk informasi lebih lanjut.`;
        break;
        
      default:
        body = `Halo ${resident.full_name},\n\nKami telah menerima permohonan layanan *${request.service_type}* Anda. Mohon menunggu proses verifikasi selanjutnya.`;
    }

    return body + `\n\n--\nDigiWarga - Sistem Informasi Desa Terpadu`;
  }

  private getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  }
}
