import jsPDF from 'jspdf';

export function generateInvoicePdf(invoice: any) {
  const doc = new jsPDF();
  doc.text('Invoice', 10, 10);
  doc.text(JSON.stringify(invoice, null, 2), 10, 20);
  return doc.output('blob');
}
