import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

interface InventoryInput {
  brand: string;
  name: string;
  volumeMl: number; // per item volume
  quantity: number; // number of items in stock
}

const COLLECTION = 'inventory';

function validateItem(item: any): asserts item is InventoryInput {
  const errors: string[] = [];
  if (!item || typeof item !== 'object') errors.push('item must be object');
  if (!item.brand || typeof item.brand !== 'string') errors.push('brand required');
  if (!item.name || typeof item.name !== 'string') errors.push('name required');
  if (typeof item.volumeMl !== 'number' || item.volumeMl <= 0) errors.push('volumeMl must be positive number');
  if (!Number.isInteger(item.quantity) || item.quantity < 0) errors.push('quantity must be integer >= 0');
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join('; '));
}

// Explicitly pin region to avoid accidental multi-region mismatch (default is us-central1 but this is clearer)
export const addInventoryItem = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    validateItem(data);
    const db = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const doc = await db.collection(COLLECTION).add({
      brand: data.brand.trim(),
      name: data.name.trim(),
      volumeMl: data.volumeMl,
      quantity: data.quantity,
      createdAt: now,
      updatedAt: now
    });
    return { id: doc.id };
  } catch (e: any) {
    console.error('[addInventoryItem] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

export const bulkImportInventory = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    if (!Array.isArray(data)) throw new functions.https.HttpsError('invalid-argument', 'Expected array');
    const db = admin.firestore();
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    const results: { index: number; status: 'ok' | 'error'; id?: string; error?: string }[] = [];
    data.forEach((raw, idx) => {
      try {
        validateItem(raw);
        const ref = db.collection(COLLECTION).doc();
        batch.set(ref, {
          brand: raw.brand.trim(),
          name: raw.name.trim(),
          volumeMl: raw.volumeMl,
          quantity: raw.quantity,
          createdAt: now,
          updatedAt: now
        });
        results.push({ index: idx, status: 'ok', id: ref.id });
      } catch (e: any) {
        results.push({ index: idx, status: 'error', error: e.message });
      }
    });

    await batch.commit();
    return { count: results.length, results };
  } catch (e: any) {
    console.error('[bulkImportInventory] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});
