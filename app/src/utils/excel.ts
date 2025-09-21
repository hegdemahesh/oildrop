import * as XLSX from 'xlsx';

export function exportInvoicesToExcel(invoices: any[]) {
  const ws = XLSX.utils.json_to_sheet(invoices);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
}
