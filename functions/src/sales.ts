import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface SaleLineInput { itemId: string; quantity: number; price: number; }
interface SaleInput { customerId: string; lines: SaleLineInput[]; paidAmount?: number; notes?: string; }
interface UpdateSaleInput { id: string; lines: SaleLineInput[]; notes?: string; }

function validateSale(data: any): asserts data is SaleInput {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('payload object required');
  if (!data.customerId || typeof data.customerId !== 'string') errors.push('customerId required');
  if (!Array.isArray(data.lines) || !data.lines.length) errors.push('lines required');
  else {
    data.lines.forEach((l: any, i: number) => {
      if (!l || typeof l !== 'object') errors.push(`lines[${i}] object required`);
      if (!l.itemId || typeof l.itemId !== 'string') errors.push(`lines[${i}].itemId required`);
      if (typeof l.quantity !== 'number' || l.quantity <= 0 || !Number.isInteger(l.quantity)) errors.push(`lines[${i}].quantity int >0`);
      if (typeof l.price !== 'number' || l.price < 0) errors.push(`lines[${i}].price >=0`);
    });
  }
  if (data.paidAmount != null && (typeof data.paidAmount !== 'number' || data.paidAmount < 0)) errors.push('paidAmount must be >=0');
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join('; '));
}

export const addSale = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    validateSale(data);
    const db = getFirestore();
    const customerRef = db.collection('customers').doc(data.customerId);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) throw new functions.https.HttpsError('not-found', 'Customer not found');

    const now = FieldValue.serverTimestamp();
    const batch = db.batch();
    let subtotal = 0;
    for (const line of data.lines) {
      subtotal += line.price * line.quantity;
      const itemRef = db.collection('inventory').doc(line.itemId);
      batch.update(itemRef, { quantity: FieldValue.increment(-line.quantity), updatedAt: now });
    }
    const tax = +(subtotal * 0.18).toFixed(2); // simple GST placeholder
    const total = +(subtotal + tax).toFixed(2);
    const paid = data.paidAmount || 0;
    const dueDelta = total - paid;

    const saleRef = db.collection('sales').doc();
    batch.set(saleRef, {
      customerId: data.customerId,
      lines: data.lines,
      subtotal,
      tax,
      total,
      paidAmount: paid,
      balanceAfter: FieldValue.increment(0), // placeholder replaced after commit
      notes: data.notes || null,
      createdAt: now,
      updatedAt: now,
      status: 'completed'
    });

    // adjust customer balance (increase by dueDelta)
    batch.update(customerRef, { balance: FieldValue.increment(dueDelta), updatedAt: now });

    batch.commit();
    return { saleId: saleRef.id, total, due: dueDelta };
  } catch (e: any) {
    console.error('[addSale] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

interface PaymentInput { customerId: string; amount: number; method?: string; note?: string; }
function validatePayment(data: any): asserts data is PaymentInput {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('payload object required');
  if (!data.customerId || typeof data.customerId !== 'string') errors.push('customerId required');
  if (typeof data.amount !== 'number' || data.amount <= 0) errors.push('amount must be >0');
  if (data.method != null && typeof data.method !== 'string') errors.push('method must be string');
  if (data.note != null && typeof data.note !== 'string') errors.push('note must be string');
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join('; '));
}

export const recordPayment = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required');
    validatePayment(data);
    const db = getFirestore();
    const customerRef = db.collection('customers').doc(data.customerId);
    const snap = await customerRef.get();
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Customer not found');
    const now = FieldValue.serverTimestamp();
    const paymentRef = customerRef.collection('payments').doc();
    const batch = db.batch();
    batch.set(paymentRef, {
      amount: data.amount,
      method: data.method || 'cash',
      note: data.note || null,
      createdAt: now
    });
    batch.update(customerRef, { balance: FieldValue.increment(-data.amount), totalPaid: FieldValue.increment(data.amount), updatedAt: now });
    await batch.commit();
    return { paymentId: paymentRef.id };
  } catch (e: any) {
    console.error('[recordPayment] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal error');
  }
});

function validateUpdateSale(data: any): asserts data is UpdateSaleInput {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') errors.push('payload object required');
  if (!data.id || typeof data.id !== 'string') errors.push('id required');
  if (!Array.isArray(data.lines) || !data.lines.length) errors.push('lines required');
  else data.lines.forEach((l:any,i:number)=>{
    if (!l || typeof l !== 'object') errors.push(`lines[${i}] object required`);
    if (!l.itemId || typeof l.itemId !== 'string') errors.push(`lines[${i}].itemId required`);
    if (typeof l.quantity !== 'number' || l.quantity<=0 || !Number.isInteger(l.quantity)) errors.push(`lines[${i}].quantity int>0`);
    if (typeof l.price !== 'number' || l.price<0) errors.push(`lines[${i}].price >=0`);
  });
  if (errors.length) throw new functions.https.HttpsError('invalid-argument', errors.join('; '));
}

export const updateSale = functions.region('us-central1').https.onCall(async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated','Auth required');
    validateUpdateSale(data);
    const db = getFirestore();
    const saleRef = db.collection('sales').doc(data.id);
    const saleSnap = await saleRef.get();
    if (!saleSnap.exists) throw new functions.https.HttpsError('not-found','Sale not found');
    const sale = saleSnap.data() as any;
    if (sale.status === 'deleted') throw new functions.https.HttpsError('failed-precondition','Sale deleted');
    const customerRef = db.collection('customers').doc(sale.customerId);
    const customerSnap = await customerRef.get();
    if (!customerSnap.exists) throw new functions.https.HttpsError('not-found','Customer missing');

    // compute old subtotal/total
    const oldSubtotal = sale.lines.reduce((s:number,l:any)=> s + l.quantity*l.price, 0);
    const oldTax = +(oldSubtotal * 0.18).toFixed(2);
    const oldTotal = +(oldSubtotal + oldTax).toFixed(2);

    // We'll rollback inventory for old lines, then apply new lines
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    // rollback old
    for (const line of sale.lines) {
      const itemRef = db.collection('inventory').doc(line.itemId);
      batch.update(itemRef, { quantity: FieldValue.increment(line.quantity), updatedAt: now });
    }
    // apply new
    let newSubtotal = 0;
    for (const line of data.lines) {
      newSubtotal += line.price * line.quantity;
      const itemRef = db.collection('inventory').doc(line.itemId);
      batch.update(itemRef, { quantity: FieldValue.increment(-line.quantity), updatedAt: now });
    }
    const newTax = +(newSubtotal * 0.18).toFixed(2);
    const newTotal = +(newSubtotal + newTax).toFixed(2);
    const delta = newTotal - oldTotal; // adjust customer balance by difference
    batch.update(customerRef, { balance: FieldValue.increment(delta), updatedAt: now });
    batch.update(saleRef, { lines: data.lines, subtotal: newSubtotal, tax: newTax, total: newTotal, notes: data.notes ?? sale.notes ?? null, updatedAt: now });
    await batch.commit();
    return { id: saleRef.id, total: newTotal, delta };
  } catch (e:any) {
    console.error('[updateSale] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal');
  }
});

export const deleteSale = functions.region('us-central1').https.onCall( async (data, context) => {
  try {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated','Auth required');
    if (!data || typeof data !== 'object' || typeof data.id !== 'string') throw new functions.https.HttpsError('invalid-argument','id required');
    const db = getFirestore();
    const saleRef = db.collection('sales').doc(data.id);
    const saleSnap = await saleRef.get();
    if (!saleSnap.exists) throw new functions.https.HttpsError('not-found','Sale not found');
    const sale = saleSnap.data() as any;
    if (sale.status === 'deleted') return { id: saleRef.id, already: true };
    const customerRef = db.collection('customers').doc(sale.customerId);
    const batch = db.batch();
    const now = FieldValue.serverTimestamp();
    // restore inventory
    for (const line of sale.lines) {
      const itemRef = db.collection('inventory').doc(line.itemId);
      batch.update(itemRef, { quantity: FieldValue.increment(line.quantity), updatedAt: now });
    }
    // reduce customer balance by sale total (reverse effect)
    batch.update(customerRef, { balance: FieldValue.increment(-sale.total), updatedAt: now });
    batch.update(saleRef, { status: 'deleted', deletedAt: now, updatedAt: now });
    await batch.commit();
    return { id: saleRef.id, deleted: true };
  } catch (e:any) {
    console.error('[deleteSale] error', e);
    if (e instanceof functions.https.HttpsError) throw e;
    throw new functions.https.HttpsError('internal', e.message || 'internal');
  }
});
