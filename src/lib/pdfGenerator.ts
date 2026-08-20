import { jsPDF } from 'jspdf';
import { RtiDraftData } from '../types';

export function generateRtiPdf(data: RtiDraftData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(14, y - 6, pageWidth - 28, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('APPLICATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005', 18, y + 4);

  y += 20;
  doc.setTextColor(15, 23, 42);

  // Addressing PIO
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('To,', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`The Public Information Officer (PIO / SPIO / CPIO)`, 14, y);
  y += 5;
  doc.text(`${data.publicAuthority || data.department}`, 14, y);
  y += 5;
  doc.text(`${data.pioAddress || data.stateOrUt || 'Government of India / State Government'}`, 14, y);

  y += 10;
  // Subject
  doc.setFont('helvetica', 'bold');
  doc.text('Subject:', 14, y);
  doc.setFont('helvetica', 'normal');
  const subjectLines = doc.splitTextToSize(data.subject || 'Seeking Information under RTI Act 2005', pageWidth - 45);
  doc.text(subjectLines, 32, y);
  y += subjectLines.length * 5 + 6;

  // Applicant Details
  doc.setFont('helvetica', 'bold');
  doc.text('1. Applicant Details:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.applicantName || 'Citizen Applicant'}`, 20, y);
  y += 5;
  doc.text(`Address: ${data.applicantAddress || 'Local Resident'}`, 20, y);
  if (data.applicantPhone) {
    y += 5;
    doc.text(`Contact Phone: ${data.applicantPhone}`, 20, y);
  }
  if (data.applicantEmail) {
    y += 5;
    doc.text(`Email: ${data.applicantEmail}`, 20, y);
  }

  y += 8;
  // Particulars of Information
  doc.setFont('helvetica', 'bold');
  doc.text('2. Particulars of Information Sought under Section 6(1):', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');

  if (data.informationPoints && data.informationPoints.length > 0) {
    data.informationPoints.forEach((pt, idx) => {
      const ptLines = doc.splitTextToSize(`${idx + 1}. ${pt}`, pageWidth - 36);
      if (y + ptLines.length * 5 > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(ptLines, 20, y);
      y += ptLines.length * 5 + 3;
    });
  }

  y += 4;
  if (data.periodFrom || data.periodTo) {
    doc.setFont('helvetica', 'bold');
    doc.text(`3. Period to which information relates: ${data.periodFrom || 'Start'} to ${data.periodTo || 'Till Date'}`, 14, y);
    y += 8;
  }

  // Statutory Fee & Declarations
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.text('4. Fee & Statutory Declarations:', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const feeLines = doc.splitTextToSize(data.feeDetails || 'Statutory fee of Rs. 10/- attached via Postal Order / Court Fee Stamp / Online Gateway.', pageWidth - 36);
  doc.text(feeLines, 20, y);
  y += feeLines.length * 5 + 4;

  const declLines = doc.splitTextToSize(data.declaration || 'I hereby declare that I am a citizen of India. In terms of Section 6(2) of the RTI Act 2005, I am not required to give reasons for requesting the information.', pageWidth - 36);
  doc.text(declLines, 20, y);
  y += declLines.length * 5 + 12;

  // Signatures & Date
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Date: ${dateStr}`, 14, y);
  doc.text('Signature of Applicant: _____________________', pageWidth - 100, y);
  y += 6;
  doc.text(`Place: ${data.stateOrUt || 'India'}`, 14, y);

  doc.save(`RTI_Application_${(data.applicantName || 'Applicant').replace(/\s+/g, '_')}.pdf`);
}

export function generateGenericDocumentPdf(title: string, content: string, applicantName: string = 'Citizen') {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Banner
  doc.setFillColor(30, 58, 138); // blue-900
  doc.rect(14, y - 6, pageWidth - 28, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 18, y + 3);

  y += 18;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const lines = doc.splitTextToSize(content, pageWidth - 28);
  lines.forEach((line: string) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(line, 14, y);
    y += 5.5;
  });

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}_${applicantName.replace(/\s+/g, '_')}.pdf`);
}
