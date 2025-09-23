import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { onInvoiceCreate } from './invoice';
import { gstSummary } from './gst';
import { addInventoryItem, bulkImportInventory, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity } from './inventory';
import { addCustomer, updateCustomer, deleteCustomer } from './customers';
import { addSale, recordPayment, updateSale, deleteSale } from './sales';

admin.initializeApp();

export const invoiceCreated = functions.firestore
  .document('invoices/{invoiceId}')
  .onCreate(onInvoiceCreate);

export const gstSummaryHttp = functions.region('us-central1').https.onRequest(gstSummary);

export const ping = functions.region('us-central1').https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  return { status: 'ok', user: context.auth.uid, time: new Date().toISOString() };
});

export { addInventoryItem, bulkImportInventory, updateInventoryItem, deleteInventoryItem, adjustInventoryQuantity, addCustomer, updateCustomer, deleteCustomer, addSale, recordPayment, updateSale, deleteSale };

