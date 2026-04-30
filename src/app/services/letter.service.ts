import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as QRCode from 'qrcode';
import { Resident, ServiceRequest, VillageConfig } from '../models/data.models';
import { DataService } from './data.service';
import { RegionService } from './region.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LetterService {
  private dataService = inject(DataService);
  private regionService = inject(RegionService);

  async generateAndUpload(request: ServiceRequest, resident: Resident): Promise<string> {
    // Fetch village config for dynamic letter header
    let vc: VillageConfig | null = null;
    try {
      vc = await firstValueFrom(this.regionService.getVillageConfig());
    } catch (e) {
      console.warn('Village config not found, using defaults.');
    }

    const villageName = vc?.village_name || 'Desa Maju Jaya';
    const districtName = vc?.district_name || 'Kecamatan Luar Biasa';
    const regencyName = vc?.regency_name || 'Kabupaten Contoh';
    const villageHead = vc?.village_head || 'Kepala Desa';
    const villageAddress = vc?.village_address || 'Jl. Raya Desa No. 01';
    const villagePhone = vc?.village_phone || '(021) 555-0123';

    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // --- HEADER (Kop Surat) ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`PEMERINTAH ${regencyName.toUpperCase()}`, 105, y, { align: 'center' });
    y += 7;
    doc.text(districtName.toUpperCase(), 105, y, { align: 'center' });
    y += 7;
    doc.text(`KANTOR KEPALA ${villageName.toUpperCase()}`, 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${villageAddress}, Telp: ${villagePhone}`, 105, y, { align: 'center' });
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 1, 210 - margin, y + 1);
    
    y += 15;

    // --- TITLE ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT KETERANGAN', 105, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const srtNum = `${new Date().getFullYear()}/SRT/${request.nik}/${Math.floor(1000 + Math.random() * 9000)}`;
    doc.text(`Nomor: ${srtNum}`, 105, y, { align: 'center' });
    
    y += 15;

    // --- OPENING ---
    const textOpening = `Yang bertanda tangan di bawah ini, Kepala ${villageName}, ${districtName}, ${regencyName}, menerangkan dengan sebenarnya bahwa:`;
    const splitOpening = doc.splitTextToSize(textOpening, 170);
    doc.text(splitOpening, margin, y);
    y += splitOpening.length * 5 + 5;

    // --- RESIDENT DATA ---
    const lineGap = 7;
    const labelX = margin + 5;
    const valueX = margin + 50;

    doc.text('Nama Lengkap', labelX, y); doc.text(`: ${resident.full_name}`, valueX, y); y += lineGap;
    doc.text('NIK', labelX, y); doc.text(`: ${resident.nik}`, valueX, y); y += lineGap;
    doc.text('Tempat/Tgl Lahir', labelX, y); doc.text(`: ${resident.birth_place}, ${resident.birth_date}`, valueX, y); y += lineGap;
    doc.text('Jenis Kelamin', labelX, y); doc.text(`: ${resident.gender}`, valueX, y); y += lineGap;
    if (resident.religion) { doc.text('Agama', labelX, y); doc.text(`: ${resident.religion}`, valueX, y); y += lineGap; }
    if (resident.marital_status) { doc.text('Status Kawin', labelX, y); doc.text(`: ${resident.marital_status}`, valueX, y); y += lineGap; }
    doc.text('Pekerjaan', labelX, y); doc.text(`: ${resident.occupation}`, valueX, y); y += lineGap;
    if (resident.citizenship) { doc.text('Kewarganegaraan', labelX, y); doc.text(`: ${resident.citizenship}`, valueX, y); y += lineGap; }
    
    doc.text('Alamat', labelX, y); 
    const addressText = resident.address || `${villageName}, ${districtName}`;
    const splitAddress = doc.splitTextToSize(`: ${addressText}`, 120);
    doc.text(splitAddress, valueX, y);
    y += splitAddress.length * 5 + 10;

    // --- CONTENT ---
    doc.text('Adalah benar penduduk yang berdomisili di wilayah kami. Surat Keterangan ini diberikan', margin, y);
    y += 6;
    doc.text(`untuk keperluan: ${request.service_type}`, margin, y);
    y += 10;
    
    const textReason = `Keterangan tambahan: ${request.reason}`;
    const splitReason = doc.splitTextToSize(textReason, 170);
    doc.text(splitReason, margin, y);
    y += 20;

    // --- CLOSING ---
    doc.text('Demikian surat keterangan ini kami buat untuk dapat dipergunakan sebagaimana mestinya.', margin, y);
    y += 30;

    // --- SIGNATURE ---
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`${villageName}, ${dateStr}`, 130, y);
    y += 6;
    doc.text(`Kepala ${villageName}`, 130, y);
    
    // Generate QR Code for Verification
    if (request.id) {
      const verifyUrl = `https://digiwarga.web.app/verify/${request.id}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 60, margin: 1 });
        doc.addImage(qrDataUrl, 'PNG', 142, y + 2, 25, 25);
      } catch (err) {
        console.error('Failed to generate QR', err);
      }
    }
    
    y += 32;
    doc.setFont('helvetica', 'bold');
    doc.text(villageHead.toUpperCase(), 130, y);
    doc.setLineWidth(0.2);
    doc.line(130, y + 1, 190, y + 1);

    // --- CONVERT & UPLOAD ---
    const pdfBlob = doc.output('blob');
    const fileName = `surat_${request.nik}_${Date.now()}.pdf`;
    const filePath = `letters/${request.nik}/${fileName}`;
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    return this.dataService.uploadFileOnly(file, filePath);
  }
}
