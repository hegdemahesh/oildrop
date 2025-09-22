import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface CustomerInput { name: string; phone?: string; }

function validateCustomer(data: any): asserts data is CustomerInput {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('payload object required');
  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) errors.push('name required');
  if (data.phone != null) {
    if (typeof data.phone !== 'string') errors.push('phone must be string');
    else if (!/^\+?[0-9\- ]{6,20}$/.test(data.phone)) errors.push('phone invalid');
  }
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join('; '));
}

export const addCustomer = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    validateCustomer(data);
    const db = getFirestore();
    const now = FieldValue.serverTimestamp();
    const doc = await db.collection('customers').add({
      name: data.name.trim(),
      phone: data.phone?.trim() || null,
      createdAt: now,
      updatedAt: now
    });
    return { id: doc.id };
  } catch (e: any) {
    console.error('[addCustomer] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});
