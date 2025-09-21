import * as admin from 'firebase-admin';
import { firestore } from 'firebase-functions';

export async function onInvoiceCreate(snapshot: firestore.QueryDocumentSnapshot, context: any) {
  const data = snapshot.data();
  const db = admin.firestore();
  const batch = db.batch();
  const items: Array<{ itemId: string; qty: number; }> = data.items || [];
  // Decrement stock
  for (const line of items) {
    const ref = db.collection('inventory').doc(line.itemId);
    batch.update(ref, { stock: admin.firestore.FieldValue.increment(-line.qty) });
  }
  await batch.commit();
  // Future: generate PDF & store in Storage
  console.log('Invoice processed', context.params.invoiceId);
}
