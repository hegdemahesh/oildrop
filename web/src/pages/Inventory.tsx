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
      setBrand(''); setName(''); setVolumeMl(0); setQuantity(0);
    } catch (e:any) {
      setError(e.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
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
        <div className="flex items-end flex-wrap gap-4 bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
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
          <div className="ml-auto flex flex-col items-start">
            <label htmlFor="importjson" className="text-xs text-slate-400 mb-1">Import JSON</label>
            <input id="importjson" type="file" accept="application/json" onChange={onFile} className="file-input file-input-bordered file-input-sm w-56" />
          </div>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id} className="hover:bg-slate-800/40">
                  <td>{it.brand}</td>
                  <td>{it.name}</td>
                  <td>{it.volumeMl}</td>
                  <td>{it.quantity}</td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500 text-sm">No inventory yet</td>
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
