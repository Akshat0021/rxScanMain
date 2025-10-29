import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PrescriptionData } from '../types';

export const generatePrescriptionPDF = (data: PrescriptionData) => {
    // A type assertion is used here because the jspdf-autotable definitions 
    // don't perfectly extend the jsPDF type.
    const doc = new jsPDF() as jsPDF & { lastAutoTable: { finalY: number } };

    // Header
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical Prescription', 105, 20, { align: 'center' });

    // Patient and Doctor Info in a simple layout
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Name:', 14, 35);
    doc.text('Doctor Name:', 14, 45);
    doc.text('Date:', 14, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text(data.patientName || 'N/A', 50, 35);
    doc.text(data.doctorName || 'N/A', 50, 45);
    doc.text(data.date || 'N/A', 50, 55);
    
    // Diagnosis
    doc.setFont('helvetica', 'bold');
    doc.text('Diagnosis:', 14, 68);
    doc.setFont('helvetica', 'normal');
    const diagnosisLines = doc.splitTextToSize(data.diagnosis || 'N/A', 180);
    doc.text(diagnosisLines, 14, 74);
    
    const diagnosisHeight = doc.getTextDimensions(diagnosisLines).h;
    let tableStartY = 74 + diagnosisHeight + 6;

    // Medications Table
    doc.setFont('helvetica', 'bold');
    doc.text('Medications', 14, tableStartY);

    autoTable(doc, {
        startY: tableStartY + 4,
        head: [['Medicine Name', 'Dosage', 'Frequency', 'Duration']],
        body: data.medications.map(med => [med.name, med.dosage, med.frequency, med.duration]),
        theme: 'striped',
        headStyles: { fillColor: [8, 145, 178] }, // Cyan color
        styles: {
            font: 'helvetica',
            fontSize: 10
        }
    });

    // Footer Disclaimer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150);
    const disclaimer = 'Disclaimer: This document is a digitized version of a prescription. AI-generated content may be inaccurate. Always verify with a healthcare professional.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, 180);
    doc.text(disclaimerLines, 105, pageHeight - 15, { align: 'center' });

    // Save the PDF
    const fileName = `Prescription-${(data.patientName || 'Details').replace(/\s/g, '_')}.pdf`;
    doc.save(fileName);
};