import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Resident, Family } from '../models/data.models';

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  generateResidentBiodata(resident: Resident, family?: Family) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text('BIODATA PENDUDUK DIGIWARGA', pageWidth / 2, 20, { align: 'center' });
    
    doc.setDrawColor(200);
    doc.line(20, 25, pageWidth - 20, 25);

    // Content
    doc.setFontSize(12);
    let y = 40;
    const leftCol = 25;
    const valueCol = 80;

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, leftCol, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '-', valueCol, y);
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
      doc.setDrawColor(240);
      doc.line(20, y, pageWidth - 20, y);
      y += 15;
      
      doc.setFontSize(14);
      doc.text('Informasi Keluarga', leftCol, y);
      y += 10;
      doc.setFontSize(12);
      
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
    doc.setTextColor(150);
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 20, footerY);
    doc.text('Sistem Informasi Kependudukan DigiWarga', pageWidth - 20, footerY, { align: 'right' });

    doc.save(`Biodata_${resident.nik}.pdf`);
  }

  generateResidentsReport(residents: Resident[], filterTitle: string = 'Seluruh Penduduk') {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('LAPORAN DATA PENDUDUK', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.text(`Kriteria: ${filterTitle}`, pageWidth / 2, 22, { align: 'center' });

    const tableData = residents.map((r, i) => [
      i + 1,
      r.nik,
      r.full_name,
      r.gender,
      r.birth_place + ', ' + r.birth_date,
      r.religion || '-',
      r.occupation,
      r.marital_status || '-',
      r.relationship
    ]);

    (doc as any).autoTable({
      startY: 30,
      head: [['No', 'NIK', 'Nama Lengkap', 'L/P', 'Tempat, Tgl Lahir', 'Agama', 'Pekerjaan', 'Status', 'Hubungan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 8 }
    });

    doc.save(`Laporan_Penduduk_${Date.now()}.pdf`);
  }

  generateFamilyCard(family: Family, members: Resident[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.text('PROFIL KARTU KELUARGA', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`No. ${family.kk_number}`, pageWidth / 2, 28, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 35, pageWidth - 20, 35);

    // Metadata
    doc.setFontSize(10);
    let y = 45;
    const addMeta = (label: string, value: string, x: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`: ${value || '-'}`, x + 35, y);
    };

    addMeta('Nama Kepala KK', family.head_of_family_name, 20);
    if (family.head_of_family_nik) { addMeta('NIK Kepala KK', family.head_of_family_nik, 20); y += 6; }
    addMeta('Alamat', family.address, 20); y += 6;
    addMeta('RT / RW', `${family.rt || '-'} / ${family.rw || '-'}`, 20);
    if (family.hamlet) { addMeta('Dusun', family.hamlet, 20); }
    addMeta('Kecamatan', family.district, 20); y += 6;
    addMeta('Kabupaten/Kota', family.regency, 20);
    addMeta('Provinsi', family.province, 20);
    if (family.social_class) { y += 6; addMeta('Kelas Sosial', family.social_class, 20); }

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
      startY: 75,
      head: [['No', 'Nama Lengkap', 'NIK', 'JK', 'Tempat/Tgl Lahir', 'Pekerjaan', 'Hubungan']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94], textColor: 255 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 35 },
        3: { cellWidth: 10 },
        6: { cellWidth: 25 }
      }
    });

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 25;
    doc.setFontSize(9);
    doc.text('Dicetak Oleh:', pageWidth - 60, footerY);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Sistem DigiWarga', pageWidth - 60, footerY + 10);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID Proyek: ${family.kk_number}`, 20, footerY + 10);

    doc.save(`KK_${family.kk_number}.pdf`);
  }
}
