import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useToast } from '../components/Toast';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

interface Customer { id: string; name: string; phone?: string | null; altPhone?: string | null; gstNumber?: string|null; email?: string|null; address?: string|null; balance?: number; createdAt?: any; updatedAt?: any; }

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editValues, setEditValues] = useState<Partial<Customer>>({});
  const [showSaleFor, setShowSaleFor] = useState<Customer|null>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const { push } = useToast();
  // Sale modal state
  interface InventoryItem { id: string; name: string; brand?: string; quantity: number; sellingPrice?: number; volumeMl?: number; }
  interface SaleLine { tempId: string; itemId: string; name: string; qty: number; price: number; max: number; }
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [saleLines, setSaleLines] = useState<SaleLine[]>([]);
  const [addingLineItemId, setAddingLineItemId] = useState<string>('');
  const [addingQty, setAddingQty] = useState<number>(1);
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleError, setSaleError] = useState<string|null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: Customer[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setCustomers(list);
    });
  }, []);

  useEffect(()=>{
    if (!showSaleFor) return;
    // load inventory only when modal active
    const q = query(collection(db, 'inventory'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: InventoryItem[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setInventory(list);
    });
  }, [showSaleFor]);

  const addCustomer = async () => {
    setError(null);
    if (!name.trim()) { setError('Name required'); return; }
    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, 'addCustomer');
      await fn({
        name: name.trim(),
        phone: phone.trim() || undefined,
        altPhone: altPhone.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        balance: balance ? parseFloat(balance) : undefined
      });
      setName(''); setPhone(''); setAltPhone(''); setGstNumber(''); setEmail(''); setAddress(''); setBalance('');
    } catch (e: any) {
      setError(e.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (c: Customer) => {
    setEditingId(c.id);
    setEditValues({
      name: c.name,
      phone: c.phone || '',
      altPhone: c.altPhone || '',
      gstNumber: c.gstNumber || '',
      email: c.email || '',
      address: c.address || '',
      balance: c.balance ?? 0
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditValues({}); };

  const saveEdit = async () => {
    if (!editingId) return;
  if (!editValues.name?.trim()) { setError('Name required'); return; }
    setSubmitting(true); setError(null);
    try {
      const fn = httpsCallable(functions, 'updateCustomer');
      await fn({
        id: editingId,
        name: editValues.name.trim(),
        phone: (editValues.phone as string)?.trim() || undefined,
        altPhone: (editValues.altPhone as string)?.trim() || undefined,
        gstNumber: (editValues.gstNumber as string)?.trim() || undefined,
        email: (editValues.email as string)?.trim() || undefined,
        address: (editValues.address as string)?.trim() || undefined,
        balance: typeof editValues.balance === 'number' ? editValues.balance : undefined
      });
      setEditingId(null); setEditValues({});
    } catch (e:any) { setError(e.message || 'Update failed'); }
    finally { setSubmitting(false); }
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('Delete this customer? This cannot be undone.')) return;
    try {
      const fn = httpsCallable(functions, 'deleteCustomer');
      await fn({ id });
    } catch (e:any) { setError(e.message || 'Delete failed'); }
  };

  const filtered = useMemo(()=>{
    if (!search.trim()) return customers;
    const s = search.trim().toLowerCase();
  return customers.filter(c => [c.name, c.phone, c.altPhone, c.gstNumber, c.email].some(v => v?.toLowerCase().includes(s)));
  },[search, customers]);

  const exportJson = () => {
    const exported = customers.map(({ id, createdAt, updatedAt, ...rest }) => rest);
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `customers-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!customers.length) return;
    const headers = ['name','phone','altPhone','gstNumber','email','address','balance'];
    const lines = [headers.join(',')];
    customers.forEach(c => {
      const row = [c.name, c.phone||'', c.altPhone||'', c.gstNumber||'', c.email||'', (c.address||'').replace(/\n/g,' '), c.balance ?? ''].map(v=>{
        const s = String(v);
        return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s;
      }).join(',');
      lines.push(row);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`customers-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setError(null);
    try {
      const text = await file.text();
      const arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error('JSON array required');
      const fn = httpsCallable(functions, 'addCustomer');
      for (const entry of arr) {
        try {
          await fn(entry);
        } catch (inner) {
          console.warn('Failed row', entry, inner);
        }
      }
    } catch (err:any) {
      setError('Import failed: '+ (err.message || 'unknown'));
    } finally { e.target.value=''; }
  };

  const openSale = (c: Customer) => setShowSaleFor(c);
  const closeSale = () => setShowSaleFor(null);
  const addLineToSale = () => {
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
  const saleTax = +(saleSubtotal * 0.18).toFixed(2); // placeholder 18%
  const saleTotal = +(saleSubtotal + saleTax).toFixed(2);

  const submitSale = async () => {
    if (!showSaleFor) return;
    if (!saleLines.length) { setSaleError('Add at least one line'); return; }
    setSaleSubmitting(true); setSaleError(null);
    try {
      const fn = httpsCallable(functions, 'addSale');
      await fn({
        customerId: showSaleFor.id,
        lines: saleLines.map(l => ({ itemId: l.itemId, quantity: l.qty, price: l.price }))
      });
      push({ type: 'success', message: 'Sale recorded' });
      setSaleLines([]); setShowSaleFor(null);
    } catch (e:any) {
      setSaleError(e.message || 'Failed to submit sale');
      push({ type: 'error', message: 'Sale failed' });
    } finally { setSaleSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-4 print:hidden">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-200">Customers</h2>
            <p className="text-sm text-slate-500">Manage customer directory</p>
          </div>
          <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-sm btn-primary">{showAdd? 'Close' : 'Add Customer'}</button>
          <div className="ml-auto flex gap-2 items-center">
            <input type="text" placeholder="Search..." className="input input-sm bg-slate-900 w-48" value={search} onChange={e=>setSearch(e.target.value)} />
            <button onClick={exportJson} className="btn btn-sm btn-outline">Export JSON</button>
            <button onClick={exportCsv} className="btn btn-sm btn-outline">Export CSV</button>
            <label className="btn btn-sm btn-outline cursor-pointer">Import JSON<input type="file" accept="application/json" onChange={onImportFile} className="hidden" /></label>
          </div>
        </div>
        {showAdd && (
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label htmlFor="cust-name" className="text-xs text-slate-400 mb-1">Name *</label>
            <input id="cust-name" className="input input-sm input-bordered bg-slate-900 w-56" value={name} onChange={e=>setName(e.target.value)} />
          </div>
            <div className="flex flex-col">
              <label htmlFor="cust-phone" className="text-xs text-slate-400 mb-1">Phone</label>
              <input id="cust-phone" className="input input-sm input-bordered bg-slate-900 w-40" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="cust-altphone" className="text-xs text-slate-400 mb-1">Alt Phone</label>
              <input id="cust-altphone" className="input input-sm input-bordered bg-slate-900 w-40" value={altPhone} onChange={e=>setAltPhone(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="cust-gst" className="text-xs text-slate-400 mb-1">GST</label>
              <input id="cust-gst" className="input input-sm input-bordered bg-slate-900 w-36" value={gstNumber} onChange={e=>setGstNumber(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="cust-email" className="text-xs text-slate-400 mb-1">Email</label>
              <input id="cust-email" type="email" className="input input-sm input-bordered bg-slate-900 w-52" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="cust-address" className="text-xs text-slate-400 mb-1">Address</label>
              <input id="cust-address" className="input input-sm input-bordered bg-slate-900 w-60" value={address} onChange={e=>setAddress(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="cust-balance" className="text-xs text-slate-400 mb-1">Opening Balance</label>
              <input id="cust-balance" type="number" className="input input-sm input-bordered bg-slate-900 w-36" value={balance} onChange={e=>setBalance(e.target.value)} />
            </div>
            <button onClick={addCustomer} disabled={submitting} className="btn btn-primary btn-sm mt-5">{submitting ? 'Adding...' : 'Add'}</button>
        </div>
        )}
        {error && <div className="alert alert-error py-2 h-10 min-h-0 text-sm">{error}</div>}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="group relative bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col gap-2">
                {!isEditing && (
                  <button onClick={()=>startEdit(c)} className="absolute top-2 right-14 btn btn-xs btn-outline opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                )}
                {!isEditing && (
                  <button onClick={()=>deleteCustomer(c.id)} className="absolute top-2 right-2 btn btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity">Del</button>
                )}
                {isEditing ? (
                  <div className="flex flex-col gap-2">
                    <input className="input input-xs bg-slate-900" value={editValues.name as string || ''} onChange={e=>setEditValues(v=>({...v,name:e.target.value}))} />
                    <div className="grid grid-cols-2 gap-2">
                      <input placeholder="Phone" className="input input-xs bg-slate-900" value={editValues.phone as string || ''} onChange={e=>setEditValues(v=>({...v,phone:e.target.value}))} />
                      <input placeholder="Alt Phone" className="input input-xs bg-slate-900" value={editValues.altPhone as string || ''} onChange={e=>setEditValues(v=>({...v,altPhone:e.target.value}))} />
                      <input placeholder="GST" className="input input-xs bg-slate-900" value={editValues.gstNumber as string || ''} onChange={e=>setEditValues(v=>({...v,gstNumber:e.target.value}))} />
                      <input placeholder="Email" className="input input-xs bg-slate-900" value={editValues.email as string || ''} onChange={e=>setEditValues(v=>({...v,email:e.target.value}))} />
                      <input placeholder="Balance" type="number" className="input input-xs bg-slate-900" value={editValues.balance as number ?? ''} onChange={e=>setEditValues(v=>({...v,balance:parseFloat(e.target.value)||0}))} />
                      <textarea placeholder="Address" className="textarea textarea-xs bg-slate-900 col-span-2" value={editValues.address as string || ''} onChange={e=>setEditValues(v=>({...v,address:e.target.value}))} />
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button className="btn btn-xs btn-success" disabled={submitting} onClick={saveEdit}>Save</button>
                      <button className="btn btn-xs" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-200 truncate" title={c.name}>{c.name}</h3>
                      {c.balance != null && c.balance !== 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.balance>0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{c.balance>0?`Due ₹${c.balance}`:`Credit ₹${Math.abs(c.balance||0)}`}</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex flex-col gap-1">
                      <div className="flex gap-2">
                        <span className="font-mono">{c.phone || '—'}</span>
                        {c.altPhone && <span className="font-mono text-slate-500">/ {c.altPhone}</span>}
                      </div>
                      {c.gstNumber && <div>GST: <span className="font-mono text-slate-300">{c.gstNumber}</span></div>}
                      {c.email && <div>Email: <span className="text-slate-300">{c.email}</span></div>}
                      {c.address && <div className="line-clamp-2" title={c.address}>{c.address}</div>}
                    </div>
                    <div className="mt-auto pt-2 flex gap-2 print:hidden">
                      <button className="btn btn-xs btn-primary" onClick={()=>openSale(c)}>Sale</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {!filtered.length && (
            <div className="col-span-full text-center py-10 text-slate-500 text-sm">No customers</div>
          )}
        </div>
        {showSaleFor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-3xl flex flex-col gap-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Create Sale - {showSaleFor.name}</h3>
                <button className="btn btn-xs" onClick={closeSale}>✕</button>
              </div>
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
                <button onClick={addLineToSale} className="btn btn-xs btn-primary mt-4">Add Line</button>
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
                <button className="btn btn-sm" onClick={closeSale} disabled={saleSubmitting}>Cancel</button>
                <button className="btn btn-sm btn-primary" disabled={saleSubmitting || !saleLines.length} onClick={submitSale}>{saleSubmitting? 'Submitting...' : 'Submit Sale'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Customers;
