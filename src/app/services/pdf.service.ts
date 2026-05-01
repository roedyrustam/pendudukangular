import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, Family, VillageConfig } from '../models/data.models';
import { RegionService } from './region.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private regionService = inject(RegionService);
  private _villageConfig: VillageConfig | null = null;

  /** Call once to cache village config for all PDF operations */
  async loadVillageConfig() {
    if (!this._villageConfig) {
      try {
        this._villageConfig = await firstValueFrom(this.regionService.getVillageConfig());
      } catch (e) { /* ignore */ }
    }
    return this._villageConfig;
  }

  private get villageName(): string {
    return this._villageConfig?.village_name || 'DigiWarga';
  }
  async generateResidentBiodata(resident: Resident, family?: Family) {
    await this.loadVillageConfig();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0); // Pure Black
    doc.text(`BIODATA PENDUDUK — ${this.villageName.toUpperCase()}`, pageWidth / 2, 25, { align: 'center' });
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 30, pageWidth - 20, 30);

    // Content
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    let y = 45;
    const leftCol = 25;
    const valueCol = 80;

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label.toUpperCase()}`, leftCol, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`:  ${value || '-'}`, valueCol - 5, y);
      y += 10;
    };

    addField('Nama Lengkap', resident.full_name);
    addField('NIK', resident.nik);
    addField('Tempat, Tgl Lahir', `${resident.birth_place}, ${resident.birth_date}`);
    addField('Jenis Kelamin', resident.gender);
    addField('Agama', resident.religion || '-');
    addField('Status Kawin', resident.marital_status || '-');
    addField('Pendidikan', resident.education || '-');
    addField('Pekerjaan', resident.occupation);
    addField('Hubungan Keluarga', resident.relationship);
    addField('Golongan Darah', resident.blood_type || '-');
    addField('Kewarganegaraan', resident.citizenship || 'WNI');
    addField('No. Telepon', resident.phone || '-');
    addField('Nama Ayah', resident.father_name || '-');
    addField('Nama Ibu', resident.mother_name || '-');
    addField('Alamat Sekarang', resident.address || '-');

    if (family) {
      y += 5;
      doc.setDrawColor(230);
      doc.line(20, y, pageWidth - 20, y);
      y += 15;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMASI KARTU KELUARGA', leftCol, y);
      y += 12;
      doc.setFontSize(11);
      
      addField('No. Kartu Keluarga', family.kk_number);
      addField('Kepala Keluarga', family.head_of_family_name);
      if (family.head_of_family_nik) addField('NIK Kepala KK', family.head_of_family_nik);
      addField('Alamat', family.address);
      addField('RT / RW', `${family.rt || '-'} / ${family.rw || '-'}`);
      if (family.hamlet) addField('Dusun', family.hamlet);
      addField('Wilayah', `${family.district}, ${family.regency}`);
      if (family.social_class) addField('Kelas Sosial', family.social_class);
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Dokumen ini diterbitkan secara digital oleh Sistem DigiWarga pada ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });

    doc.save(`Biodata_${resident.nik}.pdf`);
  }

  async generateResidentsReport(residents: Resident[], filterTitle: string = 'Seluruh Penduduk') {
    await this.loadVillageConfig();
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`LAPORAN DATA PENDUDUK — ${this.villageName.toUpperCase()}`, pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Filter Pencarian: ${filterTitle}`, pageWidth / 2, 22, { align: 'center' });

    const tableData = residents.map((r, i) => [
      i + 1,
      r.nik,
      r.full_name,
      r.gender === 'Laki-laki' ? 'L' : 'P',
      r.birth_place + ', ' + r.birth_date,
      r.religion || '-',
      r.occupation,
      r.marital_status || '-',
      r.relationship
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['NO', 'NIK', 'NAMA LENGKAP', 'L/P', 'TEMPAT, TGL LAHIR', 'AGAMA', 'PEKERJAAN', 'STATUS', 'HUBUNGAN']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, textColor: [0, 0, 0] }
    });

    doc.save(`Laporan_Penduduk_${Date.now()}.pdf`);
  }

  async generateFamilyCard(family: Family, members: Resident[]) {
    await this.loadVillageConfig();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`PROFIL KARTU KELUARGA — ${this.villageName.toUpperCase()}`, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`NO. ${family.kk_number}`, pageWidth / 2, 28, { align: 'center' });

    doc.setLineWidth(0.8);
    doc.setDrawColor(0);
    doc.line(20, 35, pageWidth - 20, 35);

    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(0);
    let y = 45;
    const addMeta = (label: string, value: string, x: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label.toUpperCase(), x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`:  ${value || '-'}`, x + 40, y);
    };

    addMeta('Nama Kepala KK', family.head_of_family_name, 20);
    if (family.head_of_family_nik) { y += 7; addMeta('NIK Kepala KK', family.head_of_family_nik, 20); }
    y += 7; addMeta('Alamat', family.address, 20);
    y += 7; addMeta('RT / RW', `${family.rt || '-'} / ${family.rw || '-'}`, 20);
    if (family.hamlet) { y += 7; addMeta('Dusun', family.hamlet, 20); }
    y += 7; addMeta('Kecamatan', family.district, 20);
    y += 7; addMeta('Kabupaten/Kota', family.regency, 20);
    y += 7; addMeta('Provinsi', family.province, 20);
    if (family.social_class) { y += 7; addMeta('Kelas Sosial', family.social_class, 20); }

    // Members Table
    const tableData = members.map((m, i) => [
      i + 1,
      m.full_name,
      m.nik,
      m.gender === 'Laki-laki' ? 'L' : 'P',
      m.birth_place + ', ' + m.birth_date,
      m.occupation,
      m.relationship
    ]);

    (doc as any).autoTable({
      startY: y + 15,
      head: [['NO', 'NAMA LENGKAP', 'NIK', 'JK', 'TEMPAT/TGL LAHIR', 'PEKERJAAN', 'HUBUNGAN']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 8, textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 10 },
        6: { cellWidth: 25 }
      }
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Diterbitkan Oleh:', pageWidth - 70, footerY);
    doc.setFontSize(11);
    doc.text(`PEMERINTAH ${this.villageName.toUpperCase()}`, pageWidth - 70, footerY + 12);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`ID VALIDASI: ${family.kk_number}-${Date.now()}`, 20, footerY + 12);

    doc.save(`KK_${family.kk_number}.pdf`);
  }

  async generateAnalysisReport(data: any[], category: string) {
    await this.loadVillageConfig();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`LAPORAN ANALISIS KELAYAKAN BANTUAN`, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`KATEGORI: ${category.toUpperCase()}`, pageWidth / 2, 28, { align: 'center' });

    const tableData = data.map((item, i) => [
      i + 1,
      item.headName,
      item.nik,
      item.socialClass,
      item.dependents,
      item.score,
      item.score >= 70 ? 'LAYAK' : 'TIDAK LAYAK'
    ]);

    (doc as any).autoTable({
      startY: 40,
      head: [['NO', 'NAMA KEPALA KK', 'NIK', 'KELAS SOSIAL', 'TANGGUNGAN', 'SKOR', 'REKOMENDASI']],
      body: tableData,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, textColor: [0, 0, 0] }
    });

    doc.save(`Analisis_Bantuan_${category}_${Date.now()}.pdf`);
  }
}
