
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { QRCodeEntry } from '../types';

export const generateBatchPDF = async (entries: QRCodeEntry[], batchName: string) => {
  const doc = new jsPDF();
  const margin = 10;
  const itemSize = 45;
  const padding = 5;
  const cols = 4;
  const rows = 5;
  const itemsPerPage = cols * rows;

  doc.setFont('helvetica', 'bold');
  
  for (let i = 0; i < entries.length; i++) {
    const pageIndex = Math.floor(i / itemsPerPage);
    const itemInPageIndex = i % itemsPerPage;
    
    if (i > 0 && itemInPageIndex === 0) {
      doc.addPage();
    }

    const col = itemInPageIndex % cols;
    const row = Math.floor(itemInPageIndex / cols);

    const x = margin + col * (itemSize + padding);
    const y = margin + row * (itemSize + padding + 10);

    // Generate QR Data URL
    const qrDataUrl = await QRCode.toDataURL(entries[i].id, { 
      margin: 1,
      width: 150 
    });

    // Draw QR
    doc.addImage(qrDataUrl, 'PNG', x, y, itemSize, itemSize);
    
    // Draw Text
    doc.setFontSize(8);
    doc.text(entries[i].id, x + itemSize / 2, y + itemSize + 4, { align: 'center' });
  }

  doc.save(`${batchName}.pdf`);
};
