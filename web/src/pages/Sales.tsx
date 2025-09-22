import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import SaleModal from '../components/SaleModal';

interface Sale { id: string; customerId: string; subtotal: number; tax: number; total: number; status?: string; createdAt?: any; }
interface Customer { id: string; name: string; balance?: number; }

const Sales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const cq = query(collection(db, 'customers'), orderBy('name'));
    return onSnapshot(cq, snap => {
      const list: Customer[] = []; snap.forEach(d=> list.push({ id: d.id, ...(d.data() as any) })); setCustomers(list);
    });
  },[]);

  useEffect(()=>{
    const qSales = query(collection(db, 'sales'), orderBy('createdAt','desc'), limit(50));
    return onSnapshot(qSales, snap => {
      const list: Sale[] = []; snap.forEach(d=> {
        const data = d.data() as any;
        list.push({ id: d.id, ...data });
      });
      setSales(list); setLoading(false);
    });
  },[]);

  const customerName = (id: string) => customers.find(c=>c.id===id)?.name || '—';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-slate-200">Sales</h2>
            <p className="text-sm text-slate-500">Recent sales activity</p>
          </div>
          <button className="btn btn-sm btn-primary ml-auto" onClick={()=>setShowModal(true)}>New Sale</button>
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
              {sales.filter(s=> s.status !== 'deleted').map(s => {
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
              {!loading && !sales.length && (
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
