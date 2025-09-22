import React, { useEffect, useMemo, useState } from 'react';
import Nav from '../components/Nav';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import SaleModal from '../components/SaleModal';

interface Sale { id: string; customerId: string; subtotal: number; tax: number; total: number; status?: string; createdAt?: any; }
interface Customer { id: string; name: string; balance?: number; }

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [docCount, setDocCount] = useState<number>(0);

  useEffect(()=>{
    const cq = query(collection(db, 'customers'), orderBy('name'));
    return onSnapshot(cq, (snap) => {
      const list: Customer[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setCustomers(list);
    });
  },[]);

  useEffect(()=>{
    const colRef = collection(db, 'sales');
    const unsub = onSnapshot(colRef,
      snap => {
        const list: Sale[] = [];
        snap.forEach(d=> list.push({ id: d.id, ...(d.data() as any) }));
        setDocCount(snap.size);
        list.sort((a,b)=>{
          const ad = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const bd = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return bd - ad;
        });
        setSales(list);
        setSnapshotError(null);
        setLastUpdate(new Date());
        setLoading(false);
      },
      err => {
        console.error('[sales snapshot] error', err);
        const msg = (err && (err as any).message) ? (err as any).message : JSON.stringify(err);
        setSnapshotError(msg);
        setLoading(false);
      }
    );
    return () => unsub();
  },[]);

  const manualRefresh = () => {
    // one-time fetch via snapshot listener pattern (attach, get first event, detach)
    const colRef = collection(db, 'sales');
    const tempUnsub = onSnapshot(colRef, snap => {
      const list: Sale[] = [];
      snap.forEach(d=> list.push({ id: d.id, ...(d.data() as any) }));
      list.sort((a,b)=>{
        const ad = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bd = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bd - ad;
      });
      setSales(list);
      setDocCount(snap.size);
      setLastUpdate(new Date());
      tempUnsub();
  }, err => { const msg = (err && (err as any).message) ? (err as any).message : JSON.stringify(err); setSnapshotError(msg); tempUnsub(); });
  };

  const customerName = (id: string) => customers.find(c=>c.id===id)?.name || '—';

  const filtered = useMemo(()=>{
    if (!search.trim()) return sales;
    const s = search.toLowerCase();
    return sales.filter(sl => customerName(sl.customerId).toLowerCase().includes(s));
  },[search, sales, customers]);

  const exportJson = () => {
    const payload = sales.map(s => ({ id: s.id, customerId: s.customerId, customer: customerName(s.customerId), subtotal: s.subtotal, tax: s.tax, total: s.total, status: s.status, createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : null }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `sales-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    if (!sales.length) return;
    const headers = ['id','customerId','customer','subtotal','tax','total','status','createdAt'];
    const lines = [headers.join(',')];
    sales.forEach(s => {
      const rowVals = [s.id, s.customerId, customerName(s.customerId), s.subtotal?.toFixed(2), s.tax?.toFixed(2), s.total?.toFixed(2), s.status || '', s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : ''];
      const row = rowVals.map(v=>{
        const str = String(v ?? '');
        return /[",\n]/.test(str) ? '"'+str.replace(/"/g,'""')+'"' : str;
      }).join(',');
      lines.push(row);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=`sales-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-200">Sales</h2>
            <p className="text-sm text-slate-500">Recent sales activity</p>
          </div>
          <div className="ml-auto flex gap-2 items-center">
            <input type="text" placeholder="Search customer..." className="input input-sm bg-slate-900 w-48" value={search} onChange={e=>setSearch(e.target.value)} />
            <button onClick={manualRefresh} className="btn btn-sm">Refresh</button>
            <button onClick={exportJson} className="btn btn-sm btn-outline">Export JSON</button>
            <button onClick={exportCsv} className="btn btn-sm btn-outline">Export CSV</button>
            <button className="btn btn-sm btn-primary" onClick={()=>setShowModal(true)}>New Sale</button>
          </div>
        </div>
        <div className="text-xs text-slate-500 flex flex-wrap gap-4">
          <span>Docs: {docCount}</span>
          <span>Showing: {filtered.length}</span>
          {lastUpdate && <span>Last update: {lastUpdate.toLocaleTimeString()}</span>}
          {snapshotError && <span className="text-rose-400">Error: {snapshotError}</span>}
        </div>
        <div className="rounded-xl border border-slate-800 overflow-hidden">
          <table className="table table-zebra-zebra table-sm">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400">
                <th className="w-40">Date</th>
                <th>Customer</th>
                <th className="text-right">Subtotal</th>
                <th className="text-right">Tax</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const created = s.createdAt?.toDate ? s.createdAt.toDate() : null;
                return (
                  <tr key={s.id} className="hover:bg-slate-800/40">
                    <td className="text-xs text-slate-400">{created ? created.toLocaleString() : '—'}</td>
                    <td className="text-slate-300">{customerName(s.customerId)}</td>
                    <td className="text-right font-mono text-slate-300 text-xs">₹{s.subtotal?.toFixed(2)}</td>
                    <td className="text-right font-mono text-slate-300 text-xs">₹{s.tax?.toFixed(2)}</td>
                    <td className="text-right font-mono text-slate-200 flex items-center justify-end gap-2">₹{s.total?.toFixed(2)} {s.status==='deleted' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Deleted</span>}</td>
                  </tr>
                );
              })}
              {!loading && !filtered.length && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-600 text-sm">No sales yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <SaleModal open={showModal} onClose={()=>setShowModal(false)} customers={customers} />
    </div>
  );
};

export default Sales;
