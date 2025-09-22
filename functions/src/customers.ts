import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface CustomerInput { name: string; phone?: string; altPhone?: string; gstNumber?: string; email?: string; address?: string; balance?: number; }

function validatePhoneLike(label: string, value: any, errors: string[]) {
  if (value != null) {
    if (typeof value !== 'string') errors.push(`${label} must be string`);
    else if (!/^\+?[0-9\- ]{6,20}$/.test(value)) errors.push(`${label} invalid`);
  }
}

function validateString(label: string, value: any, errors: string[]) {
  if (value != null && typeof value !== 'string') errors.push(`${label} must be string`);
}

function validateCustomer(data: any): asserts data is CustomerInput {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('payload object required');
  if (!data?.name || typeof data.name !== 'string' || !data.name.trim()) errors.push('name required');
  validatePhoneLike('phone', data.phone, errors);
  validatePhoneLike('altPhone', data.altPhone, errors);
  validateString('gstNumber', data.gstNumber, errors);
  validateString('email', data.email, errors);
  validateString('address', data.address, errors);
  if (data.balance != null && (typeof data.balance !== 'number' || isNaN(data.balance))) errors.push('balance must be number');
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
      altPhone: data.altPhone?.trim() || null,
      gstNumber: data.gstNumber?.trim() || null,
      email: data.email?.trim() || null,
      address: data.address?.trim() || null,
      balance: typeof data.balance === 'number' ? data.balance : 0,
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

interface UpdateCustomerInput extends Partial<Omit<CustomerInput, 'name'>> { id: string; name?: string; }

function validateUpdateCustomer(data: any): asserts data is UpdateCustomerInput {
  if (!data || typeof data !== 'object') throw new functions.https.HttpsError('invalid-argument', 'payload object required');
  if (!data.id || typeof data.id !== 'string') throw new functions.https.HttpsError('invalid-argument', 'id required');
  // Reuse validation selectively
  validateCustomer({
    name: data.name ?? 'temp', // placeholder to pass name required; we'll handle absence
    phone: data.phone,
    altPhone: data.altPhone,
    gstNumber: data.gstNumber,
    email: data.email,
    address: data.address,
    balance: data.balance
  });
}

function buildCustomerUpdate(data: UpdateCustomerInput): any {
  const update: any = { updatedAt: FieldValue.serverTimestamp() };
  const stringTrimNullable = (v: any) => (v ? v.trim() : null);
  const m: Array<[keyof UpdateCustomerInput, (val: any)=>any]> = [
    ['name', (v)=> v.trim()],
    ['phone', stringTrimNullable],
    ['altPhone', stringTrimNullable],
    ['gstNumber', stringTrimNullable],
    ['email', stringTrimNullable],
    ['address', stringTrimNullable]
  ];
  for (const [field, fn] of m) {
    if ((data as any)[field] !== undefined) update[field] = fn((data as any)[field]);
  }
  if (data.balance !== undefined) update.balance = data.balance;
  return update;
}

export const updateCustomer = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    validateUpdateCustomer(data);
    const { id } = data;
    if (data.name != null && (!data.name.trim())) throw new functions.https.HttpsError('invalid-argument', 'name invalid');
    const db = getFirestore();
    const ref = db.collection('customers').doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Customer not found');
    const update = buildCustomerUpdate(data);
    await ref.update(update);
    return { id };
  } catch (e: any) {
    console.error('[updateCustomer] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

export const deleteCustomer = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    if (!data || typeof data.id !== 'string') throw new functions.https.HttpsError('invalid-argument', 'id required');
    const db = getFirestore();
    const ref = db.collection('customers').doc(data.id);
    const snap = await ref.get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Customer not found');
    // Future: check for existing sales/invoices before allowing delete.
    await ref.delete();
    return { id: data.id };
  } catch (e: any) {
    console.error('[deleteCustomer] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});
