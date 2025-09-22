import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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
  const db = getFirestore();
  const now = FieldValue.serverTimestamp();
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
  const db = getFirestore();
  const batch = db.batch();
  const now = FieldValue.serverTimestamp();

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

function buildInventoryUpdate(data: any) {
  const { brand, name, volumeMl, quantity } = data || {};
  const noFields = brand === undefined && name === undefined && volumeMl === undefined && quantity === undefined;
  if (noFields) throw new functions.https.HttpsError('invalid-argument', 'no fields to update');
  const update: any = { updatedAt: FieldValue.serverTimestamp() };
  if (brand !== undefined) {
    if (!brand || typeof brand !== 'string') throw new functions.https.HttpsError('invalid-argument', 'brand invalid');
    update.brand = brand.trim();
  }
  if (name !== undefined) {
    if (!name || typeof name !== 'string') throw new functions.https.HttpsError('invalid-argument', 'name invalid');
    update.name = name.trim();
  }
  if (volumeMl !== undefined) {
    if (typeof volumeMl !== 'number' || volumeMl <= 0) throw new functions.https.HttpsError('invalid-argument', 'volumeMl must be positive number');
    update.volumeMl = volumeMl;
  }
  if (quantity !== undefined) {
    if (!Number.isInteger(quantity) || quantity < 0) throw new functions.https.HttpsError('invalid-argument', 'quantity must be integer >= 0');
    update.quantity = quantity;
  }
  return update;
}

export const updateInventoryItem = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    const { id } = data || {};
    if (!id || typeof id !== 'string') throw new functions.https.HttpsError('invalid-argument', 'id required');
    const update = buildInventoryUpdate(data);
    const db = getFirestore();
    await db.collection(COLLECTION).doc(id).set(update, { merge: true });
    return { id };
  } catch (e: any) {
    console.error('[updateInventoryItem] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

export const deleteInventoryItem = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    const { id } = data || {};
    if (!id || typeof id !== 'string') throw new functions.https.HttpsError('invalid-argument', 'id required');
    const db = getFirestore();
    await db.collection(COLLECTION).doc(id).delete();
    return { id, deleted: true };
  } catch (e: any) {
    console.error('[deleteInventoryItem] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

export const adjustInventoryQuantity = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    const { id, delta } = data || {};
    if (!id || typeof id !== 'string') throw new functions.https.HttpsError('invalid-argument', 'id required');
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 500) throw new functions.https.HttpsError('invalid-argument', 'delta must be integer between -500 and 500 excluding 0');
    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(id);
    const newQty = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new functions.https.HttpsError('not-found', 'item not found');
      const current = snap.get('quantity');
      if (!Number.isInteger(current)) throw new functions.https.HttpsError('failed-precondition', 'current quantity invalid');
      const updated = current + delta;
      if (updated < 0) throw new functions.https.HttpsError('failed-precondition', 'quantity cannot go below 0');
      tx.update(ref, { quantity: updated, updatedAt: FieldValue.serverTimestamp() });
      return updated;
    });
    return { id, quantity: newQty };
  } catch (e: any) {
    console.error('[adjustInventoryQuantity] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});
