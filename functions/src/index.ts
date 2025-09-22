import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onInvoiceCreate } from './invoice';
import { gstSummary } from './gst';
import { addInventoryItem, bulkImportInventory } from './inventory';

admin.initializeApp();

export const invoiceCreated = functions.firestore
  .document('invoices/{invoiceId}')
  .onCreate(onInvoiceCreate);

export const gstSummaryHttp = functions.https.onRequest(gstSummary);

export const ping = functions.https.onRequest((req: functions.https.Request, res: functions.Response<any>) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export { addInventoryItem, bulkImportInventory };

