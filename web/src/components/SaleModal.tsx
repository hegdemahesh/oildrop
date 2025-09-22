import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useToast } from './Toast';

export interface CustomerRef { id: string; name: string; balance?: number; }
interface InventoryItem { id: string; name: string; quantity: number; sellingPrice?: number; brand?: string; volumeMl?: number; }
interface SaleLine { tempId: string; itemId: string; name: string; qty: number; price: number; max: number; }

export interface SaleModalProps {
  open: boolean;
  onClose(): void;
  // When provided, customer is locked. If absent, allow selecting from list.
  customer?: CustomerRef | null;
  // Provide list of customers (only required when customer not preselected)
  customers?: CustomerRef[];
}

const SaleModal: React.FC<SaleModalProps> = ({ open, onClose, customer, customers = [] }) => {
  const { push } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [addingLineItemId, setAddingLineItemId] = useState('');
  const [addingQty, setAddingQty] = useState(1);
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string|null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Load inventory only when modal open
  useEffect(()=>{
    if (!open) return;
    const q = query(collection(db, 'inventory'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: InventoryItem[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setInventory(list);
    });
  }, [open]);

  // Reset internal state when closed
  useEffect(()=>{
    if (!open) { setSaleLines([]); setAddingLineItemId(''); setAddingQty(1); setSaleError(null); setSelectedCustomerId(''); }
  }, [open]);

  const effectiveCustomerId = customer?.id || selectedCustomerId;

  const addLine = () => {
    if (!addingLineItemId) return;
    const item = inventory.find(i => i.id === addingLineItemId);
    if (!item) return;
    if (addingQty <=0 || addingQty > item.quantity) { setSaleError('Invalid quantity'); return; }
    setSaleError(null);
    setSaleLines(ls => [...ls, { tempId: Math.random().toString(36).slice(2), itemId: item.id, name: item.name, qty: addingQty, price: item.sellingPrice ?? 0, max: item.quantity }]);
    setAddingLineItemId(''); setAddingQty(1);
  };

  const updateLine = (tempId: string, changes: Partial<SaleLine>) => {
    setSaleLines(ls => ls.map(l => l.tempId === tempId ? { ...l, ...changes } : l));
  };
  const removeLine = (tempId: string) => setSaleLines(ls => ls.filter(l => l.tempId !== tempId));

  const saleSubtotal = saleLines.reduce((s,l)=> s + l.qty * l.price, 0);
  const saleTax = +(saleSubtotal * 0.18).toFixed(2);
  const saleTotal = +(saleSubtotal + saleTax).toFixed(2);

  const submit = async () => {
    if (!effectiveCustomerId) { setSaleError('Select customer'); return; }
    if (!saleLines.length) { setSaleError('Add at least one line'); return; }
    setSaleSubmitting(true); setSaleError(null);
    try {
      const fn = httpsCallable(functions, 'addSale');
      await fn({ customerId: effectiveCustomerId, lines: saleLines.map(l => ({ itemId: l.itemId, quantity: l.qty, price: l.price })) });
      push({ type: 'success', message: 'Sale recorded' });
      onClose();
      setSaleLines([]);
    } catch (e:any) {
      setSaleError(e.message || 'Failed to record sale');
      push({ type: 'error', message: 'Sale failed' });
    } finally { setSaleSubmitting(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-3xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Create Sale{customer ? ` - ${customer.name}` : ''}</h3>
          <button className="btn btn-xs" onClick={onClose}>✕</button>
        </div>
        {!customer && (
          <div className="flex flex-col gap-1">
            <label htmlFor="sale-customer" className="text-[10px] uppercase tracking-wide text-slate-400">Customer</label>
            <select id="sale-customer" className="select select-xs bg-slate-900 w-72" value={selectedCustomerId} onChange={e=>setSelectedCustomerId(e.target.value)}>
              <option value="">-- Select Customer --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-4 flex-wrap items-end bg-slate-800/40 p-3 rounded-lg">
          <div className="flex flex-col">
            <label htmlFor="sale-inventory" className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Inventory Item</label>
            <select id="sale-inventory" className="select select-xs bg-slate-900 w-64" value={addingLineItemId} onChange={e=>setAddingLineItemId(e.target.value)}>
              <option value="">-- Select --</option>
              {inventory.map(it => (
                <option key={it.id} value={it.id}>{it.name} ({it.quantity} in stock)</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="sale-qty" className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Qty</label>
            <input id="sale-qty" type="number" min={1} className="input input-xs bg-slate-900 w-24" value={addingQty} onChange={e=>setAddingQty(parseInt(e.target.value,10)||1)} />
          </div>
          <button onClick={addLine} className="btn btn-xs btn-primary mt-4">Add Line</button>
          <div className="ml-auto text-xs text-slate-500">Lines: {saleLines.length}</div>
        </div>
        <div className="overflow-auto rounded-lg border border-slate-700/60">
          <table className="table table-xs">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400">
                <th className="w-56">Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Line Total</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {saleLines.map(l => (
                <tr key={l.tempId} className="hover:bg-slate-800/40">
                  <td className="text-slate-300">{l.name}</td>
                  <td>
                    <input type="number" min={1} max={l.max} className="input input-xs bg-slate-900 w-20" value={l.qty} onChange={e=>updateLine(l.tempId,{ qty: Math.min(Math.max(1, parseInt(e.target.value,10)||1), l.max) })} />
                    <div className="text-[10px] text-slate-500">max {l.max}</div>
                  </td>
                  <td>
                    <input type="number" min={0} step="0.01" className="input input-xs bg-slate-900 w-24" value={l.price} onChange={e=>updateLine(l.tempId,{ price: parseFloat(e.target.value)||0 })} />
                  </td>
                  <td className="text-right pr-4">{(l.qty * l.price).toFixed(2)}</td>
                  <td><button className="btn btn-ghost btn-xs" onClick={()=>removeLine(l.tempId)}>✕</button></td>
                </tr>
              ))}
              {!saleLines.length && (
                <tr><td colSpan={5} className="text-center py-8 text-slate-600">No lines yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-6 items-center justify-end text-sm">
          <div>Subtotal: <span className="text-slate-200 font-medium">₹{saleSubtotal.toFixed(2)}</span></div>
          <div>GST 18%: <span className="text-slate-200 font-medium">₹{saleTax.toFixed(2)}</span></div>
          <div>Total: <span className="text-slate-200 font-semibold">₹{saleTotal.toFixed(2)}</span></div>
        </div>
        {saleError && <div className="alert alert-error py-2 h-9 min-h-0 text-xs">{saleError}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button className="btn btn-sm" onClick={onClose} disabled={saleSubmitting}>Cancel</button>
          <button className="btn btn-sm btn-primary" disabled={saleSubmitting || !saleLines.length} onClick={submit}>{saleSubmitting? 'Submitting...' : 'Submit Sale'}</button>
        </div>
      </div>
    </div>
  );
};

export default SaleModal;
