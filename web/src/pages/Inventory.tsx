import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

interface InventoryItem { id: string; brand: string; name: string; volumeMl: number; quantity: number; createdAt?: unknown; }

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [volumeMl, setVolumeMl] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{brand:string; name:string; volumeMl:number; quantity:number}>({brand:'',name:'',volumeMl:0,quantity:0});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  interface ImportResult { count: number; results: { index: number; status: string; id?: string; error?: string }[] }
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: InventoryItem[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setItems(list);
    });
  }, []);

  const addItem = async () => {
    setError(null);
    if (!brand.trim() || !name.trim() || volumeMl <= 0 || quantity < 0) {
      setError('Fill all fields (volume > 0, quantity >= 0)');
      return;
    }
    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, 'addInventoryItem');
      await fn({ brand: brand.trim(), name: name.trim(), volumeMl, quantity });
      setBrand(''); setName(''); setVolumeMl(0); setQuantity(0); setShowAdd(false);
    } catch (e:any) {
      setError(e.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({ brand: item.brand, name: item.name, volumeMl: item.volumeMl, quantity: item.quantity });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { brand, name, volumeMl, quantity } = editValues;
    if (!brand.trim() || !name.trim() || volumeMl <= 0 || quantity < 0) { setError('Invalid values'); return; }
    setSubmitting(true); setError(null);
    try {
      const fn = httpsCallable(functions, 'updateInventoryItem');
      await fn({ id: editingId, brand: brand.trim(), name: name.trim(), volumeMl, quantity });
      setEditingId(null);
    } catch (e:any) {
      setError(e.message || 'Update failed');
    } finally { setSubmitting(false); }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    setError(null);
    try {
      const fn = httpsCallable(functions, 'deleteInventoryItem');
      await fn({ id });
    } catch (e:any) { setError(e.message || 'Delete failed'); }
  };

  const adjustQuantity = async (id: string, delta: number) => {
    try {
      const fn = httpsCallable(functions, 'adjustInventoryQuantity');
      await fn({ id, delta });
    } catch (e) {
      console.warn('Adjust failed', e);
    }
  };

  const exportJson = () => {
    const exported = items.map(({ id, createdAt, ...rest }) => rest); // match import schema (brand,name,volumeMl,quantity)
    const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!items.length) return;
    const headers = ['brand','name','volumeMl','quantity'];
    const lines = [headers.join(',')];
    items.forEach(it => {
      const row = [it.brand, it.name, it.volumeMl, it.quantity].map(v => {
        const s = String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
      }).join(',');
      lines.push(row);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inventory-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const printPage = () => {
    window.print();
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const fn = httpsCallable(functions, 'bulkImportInventory');
      const res: any = await fn(json);
      setImportResult(res.data);
    } catch (err:any) {
      setError('Import failed: ' + (err.message || 'unknown'));
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <h2 className="text-lg font-semibold text-slate-200">Inventory</h2>
          <button onClick={()=>setShowAdd(s=>!s)} className="btn btn-sm btn-primary">{showAdd ? 'Close' : 'Add Inventory'}</button>
          <div className="flex gap-2">
            <button onClick={exportJson} className="btn btn-sm btn-outline">Export JSON</button>
            <button onClick={exportCsv} className="btn btn-sm btn-outline">Export CSV</button>
            <button onClick={printPage} className="btn btn-sm btn-outline">Print</button>
          </div>
          <div className="ml-auto flex flex-col items-start bg-slate-800/40 border border-slate-700 p-3 rounded-lg">
            <label htmlFor="importjson" className="text-xs text-slate-400 mb-1">Import JSON</label>
            <input id="importjson" type="file" accept="application/json" onChange={onFile} className="file-input file-input-bordered file-input-xs w-52" />
          </div>
        </div>
        {showAdd && (
          <div className="flex items-end flex-wrap gap-4 bg-slate-800/60 border border-slate-700 p-4 rounded-xl">
            <div className="flex flex-col">
              <label htmlFor="brand" className="text-xs text-slate-400 mb-1">Brand / Company</label>
              <input id="brand" className="input input-sm input-bordered bg-slate-900" value={brand} onChange={e=>setBrand(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="prod" className="text-xs text-slate-400 mb-1">Product Name</label>
              <input id="prod" className="input input-sm input-bordered bg-slate-900" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="vol" className="text-xs text-slate-400 mb-1">Volume (ml)</label>
              <input id="vol" type="number" className="input input-sm input-bordered bg-slate-900 w-32" value={volumeMl||''} onChange={e=>setVolumeMl(parseInt(e.target.value,10)||0)} />
            </div>
            <div className="flex flex-col">
              <label htmlFor="qty" className="text-xs text-slate-400 mb-1">Quantity (items)</label>
              <input id="qty" type="number" className="input input-sm input-bordered bg-slate-900 w-32" value={quantity||''} onChange={e=>setQuantity(parseInt(e.target.value,10)||0)} />
            </div>
            <button onClick={addItem} disabled={submitting} className="btn btn-primary btn-sm mt-5">{submitting? 'Saving...' : 'Add Item'}</button>
          </div>
        )}
        {error && <div className="alert alert-error py-2 h-10 min-h-0 text-sm">{error}</div>}
        {importResult && (
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-xs max-h-60 overflow-auto">
            <div className="font-semibold mb-2">Import Result</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(importResult, null, 2)}</pre>
          </div>
        )}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <table className="table table-zebra-zebra w-full">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400 bg-slate-800/60">
                <th>Brand</th>
                <th>Name</th>
                <th>Volume (ml)</th>
                <th>Quantity</th>
                <th className="w-40 print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-800/40">
                  <td>
                    {editingId === it.id ? (
                      <input className="input input-xs bg-slate-900 w-32" value={editValues.brand} onChange={e=>setEditValues(v=>({...v,brand:e.target.value}))} />
                    ) : it.brand}
                  </td>
                  <td>
                    {editingId === it.id ? (
                      <input className="input input-xs bg-slate-900 w-44" value={editValues.name} onChange={e=>setEditValues(v=>({...v,name:e.target.value}))} />
                    ) : it.name}
                  </td>
                  <td>
                    {editingId === it.id ? (
                      <input type="number" className="input input-xs bg-slate-900 w-24" value={editValues.volumeMl||''} onChange={e=>setEditValues(v=>({...v,volumeMl:parseInt(e.target.value,10)||0}))} />
                    ) : it.volumeMl}
                  </td>
                  <td className="print:align-top">
                    <div className="flex items-center gap-1">
                      {editingId === it.id ? (
                        <input type="number" className="input input-xs bg-slate-900 w-20" value={editValues.quantity||''} onChange={e=>setEditValues(v=>({...v,quantity:parseInt(e.target.value,10)||0}))} />
                      ) : (
                        <>
                          <span>{it.quantity}</span>
                          <div className="flex flex-col ml-1 print:hidden">
                            <button className="btn btn-[6px] btn-xs h-4 min-h-0" onClick={()=>adjustQuantity(it.id, 1)}>▲</button>
                            <button className="btn btn-[6px] btn-xs h-4 min-h-0" onClick={()=>adjustQuantity(it.id, -1)}>▼</button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="print:hidden">
                    {editingId === it.id ? (
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-success" disabled={submitting} onClick={saveEdit}>Save</button>
                        <button className="btn btn-xs btn-ghost" onClick={cancelEdit}>Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className="btn btn-xs btn-outline" onClick={()=>startEdit(it)}>Edit</button>
                        <button className="btn btn-xs btn-error" onClick={()=>deleteItem(it.id)}>Del</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500 text-sm">No inventory yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Inventory;
