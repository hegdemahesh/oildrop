import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onInvoiceCreate } from './invoice';
import { gstSummary } from './gst';
import { addInventoryItem, bulkImportInventory, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity } from './inventory';
import { addCustomer } from './customers';
import { addSale, recordPayment } from './sales';

admin.initializeApp();

export const invoiceCreated = functions.firestore
  .document('invoices/{invoiceId}')
  .onCreate(onInvoiceCreate);

export const gstSummaryHttp = functions.region('us-central1').https.onRequest(gstSummary);

export const ping = functions.region('us-central1').https.onRequest((req: functions.https.Request, res: functions.Response<any>) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export { addInventoryItem, bulkImportInventory, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity, addCustomer, addSale, recordPayment };

