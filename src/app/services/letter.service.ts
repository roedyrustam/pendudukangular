import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { Resident, ServiceRequest } from '../models/data.models';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class LetterService {
  private dataService = inject(DataService);

  async generateAndUpload(request: ServiceRequest, resident: Resident): Promise<string> {
    const doc = new jsPDF();
    const margin = 20;
    let y = 30;

    // --- HEADER (Kop Surat) ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PEMERINTAH KABUPATEN CONTOH', 105, y, { align: 'center' });
    y += 7;
    doc.text('KECAMATAN LUAR BIASA', 105, y, { align: 'center' });
    y += 7;
    doc.text('KANTOR KEPALA DESA MAJU JAYA', 105, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Jl. Raya Cyber No. 01, Kode Pos 12345, Telp: (021) 555-0123', 105, y, { align: 'center' });
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
    doc.text(`Nomor: ${new Date().getFullYear()}/SRT/${request.nik}/${Math.floor(1000 + Math.random() * 9000)}`, 105, y, { align: 'center' });
    
    y += 15;

    // --- OPENING ---
    const textOpening = 'Yang bertanda tangan di bawah ini, Kepala Desa Maju Jaya, Kecamatan Luar Biasa, Kabupaten Contoh, menerangkan dengan sebenarnya bahwa:';
    const splitOpening = doc.splitTextToSize(textOpening, 170);
    doc.text(splitOpening, margin, y);
    y += 12;

    // --- RESIDENT DATA ---
    const lineGap = 7;
    doc.text('Nama Lengkap', margin + 5, y); doc.text(`: ${resident.full_name}`, margin + 50, y); y += lineGap;
    doc.text('NIK', margin + 5, y); doc.text(`: ${resident.nik}`, margin + 50, y); y += lineGap;
    doc.text('Tempat/Tgl Lahir', margin + 5, y); doc.text(`: ${resident.birth_place}, ${resident.birth_date}`, margin + 50, y); y += lineGap;
    doc.text('Pekerjaan', margin + 5, y); doc.text(`: ${resident.occupation}`, margin + 50, y); y += lineGap;
    doc.text('Alamat', margin + 5, y); 
    const splitAddress = doc.splitTextToSize(`: RT 001 / RW 012, Desa Maju Jaya, Kec. Luar Biasa`, 120);
    doc.text(splitAddress, margin + 50, y);
    y += 15;

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
    doc.text(`Maju Jaya, ${dateStr}`, 140, y);
    y += 6;
    doc.text('Kepala Desa Maju Jaya', 140, y);
    y += 25;
    doc.setFont('helvetica', 'bold');
    doc.text('BPK. PANDU TALENTA, M.Si', 140, y);
    doc.setLineWidth(0.2);
    doc.line(140, y + 1, 190, y + 1);

    // --- CONVERT & UPLOAD ---
    const pdfBlob = doc.output('blob');
    const fileName = `surat_${request.nik}_${Date.now()}.pdf`;
    const filePath = `letters/${request.nik}/${fileName}`;
    
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    return this.dataService.uploadFileOnly(file, filePath);
  }
}
