import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Nav from '../components/Nav';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { db, functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { useToast } from '../components/Toast';

interface Customer { id: string; name: string; phone?: string|null; altPhone?: string|null; gstNumber?: string|null; email?: string|null; address?: string|null; balance?: number; createdAt?: any; updatedAt?: any; }
interface Sale { id: string; subtotal: number; tax: number; total: number; createdAt?: any; lines: { itemId: string; quantity: number; price: number; }[]; }
interface Payment { id: string; amount: number; method?: string; note?: string|null; createdAt?: any; }

const CustomerDetail: React.FC = () => {
  const { id } = useParams();
  const { push } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLinesFor, setShowLinesFor] = useState<string|null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNote, setPayNote] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [editSaleId, setEditSaleId] = useState<string|null>(null);
  const [editLines, setEditLines] = useState<{ idx: number; quantity: number; price: number; }[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Subscribe to customer
  useEffect(()=>{
    if (!id) return;
    const ref = doc(db, 'customers', id);
    return onSnapshot(ref, snap => {
      if (!snap.exists()) { setCustomer(null); } else { setCustomer({ id: snap.id, ...(snap.data() as any) }); }
    });
  },[id]);

  // Sales subscription filtered (needs index customerId+createdAt)
  useEffect(()=>{
    if (!id) return;
    const qSales = query(collection(db, 'sales'), where('customerId','==', id), orderBy('createdAt','desc'));
    return onSnapshot(qSales, snap => {
      const list: Sale[] = [];
      snap.forEach(d => {
        const data = d.data() as any;
        if (data.status !== 'deleted') list.push({ id: d.id, ...data });
      });
      setSales(list); setLoading(false);
    });
  },[id]);

  // Payments subscription (subcollection)
  useEffect(()=>{
    if (!id) return;
    const qPay = query(collection(db, 'customers', id, 'payments'), orderBy('createdAt','desc'));
    return onSnapshot(qPay, snap => {
      const list: Payment[] = [];
      snap.forEach(d => list.push({ id: d.id, ...(d.data() as any) }));
      setPayments(list);
    });
  },[id]);

  const totalPaid = useMemo(()=> payments.reduce((s,p)=> s + (p.amount||0),0), [payments]);
  const salesTotal = useMemo(()=> sales.reduce((s,sl)=> s + (sl.total||0),0), [sales]);

  const submitPayment = async () => {
    if (!id) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <=0) { push({ type:'error', message:'Enter amount'}); return; }
    setPaySubmitting(true);
    try {
      const fn = httpsCallable(functions, 'recordPayment');
      await fn({ customerId: id, amount: amt, method: payMethod, note: payNote.trim() || undefined });
      setPayAmount('');
      setPayNote('');
      push({ type:'success', message:'Payment recorded'});
    } catch (e:any) { push({ type:'error', message: e.message || 'Failed'}); }
    finally { setPaySubmitting(false); }
  };

  const startEditSale = (sale: Sale) => {
    setEditSaleId(sale.id);
    setEditLines(sale.lines.map((l, idx)=> ({ idx, quantity: l.quantity, price: l.price })));
  };
  const cancelEditSale = () => { setEditSaleId(null); setEditLines([]); };
  const updateEditLine = (index: number, changes: Partial<{ quantity: number; price: number; }>) => {
    setEditLines(ls => ls.map(l => l.idx === index ? { ...l, ...changes } : l));
  };
  const saveSaleEdits = async () => {
    if (!editSaleId) return;
    const sale = sales.find(s=>s.id===editSaleId);
    if (!sale) return;
    setEditSubmitting(true);
    try {
      const updatedLines = sale.lines.map((l,i)=>{
        const mod = editLines.find(el=>el.idx===i);
        return mod ? { itemId: l.itemId, quantity: mod.quantity, price: mod.price } : l;
      });
      const fn = httpsCallable(functions, 'updateSale');
      await fn({ id: editSaleId, lines: updatedLines });
      push({ type:'success', message:'Sale updated'});
      setEditSaleId(null); setEditLines([]);
    } catch (e:any) { push({ type:'error', message: e.message || 'Update failed'}); }
    finally { setEditSubmitting(false); }
  };

  const deleteSale = async (saleId: string) => {
    if (!confirm('Delete this sale? Inventory and balance will be adjusted.')) return;
    try {
      const fn = httpsCallable(functions, 'deleteSale');
      await fn({ id: saleId });
      push({ type:'success', message:'Sale deleted'});
    } catch (e:any) { push({ type:'error', message: e.message || 'Delete failed'}); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-200">Customer Detail</h2>
            <Link to="/customers" className="link text-xs text-slate-400">← Back to Customers</Link>
            {!customer && <div className="text-slate-500 text-sm">Loading...</div>}
            {customer && (
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-sm flex flex-col gap-2 w-80">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{customer.name}</span>
                  {customer.balance != null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${customer.balance>0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{customer.balance>0?`Due ₹${customer.balance}`:`Credit ₹${Math.abs(customer.balance||0)}`}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-1 text-slate-400">
                  <div><span className="text-slate-500">Phone:</span> {customer.phone || '—'} {customer.altPhone && <span className="text-slate-600 ml-1">/ {customer.altPhone}</span>}</div>
                  {customer.gstNumber && <div><span className="text-slate-500">GST:</span> <span className="font-mono text-slate-300">{customer.gstNumber}</span></div>}
                  {customer.email && <div><span className="text-slate-500">Email:</span> {customer.email}</div>}
                  {customer.address && <div className="whitespace-pre-wrap text-slate-300">{customer.address}</div>}
                  <div className="flex gap-4 pt-2 text-xs">
                    <div>Total Sales: <span className="text-slate-200 font-medium">{sales.length}</span></div>
                    <div>Sales Value: <span className="text-slate-200 font-medium">₹{salesTotal.toFixed(2)}</span></div>
                    <div>Paid: <span className="text-slate-200 font-medium">₹{totalPaid.toFixed(2)}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 bg-slate-800/40 border border-slate-700 rounded-xl p-4 w-80 h-fit">
            <h3 className="text-sm font-semibold text-slate-300">Record Payment</h3>
            <input type="number" className="input input-sm bg-slate-900" placeholder="Amount" value={payAmount} onChange={e=>setPayAmount(e.target.value)} />
            <input type="text" className="input input-sm bg-slate-900" placeholder="Note (optional)" value={payNote} onChange={e=>setPayNote(e.target.value)} />
            <select className="select select-sm bg-slate-900" value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>
            <button className="btn btn-sm btn-primary" disabled={paySubmitting} onClick={submitPayment}>{paySubmitting? 'Saving...' : 'Add Payment'}</button>
          </div>
        </div>
        {/* Sales Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Sales</h3>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="table table-xs">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400">
                  <th className="w-40">Date</th>
                  <th>Total</th>
                  <th>Lines</th>
                  <th className="w-40" />
                </tr>
              </thead>
              <tbody>
                {sales.map(s => {
                  const created = s.createdAt?.toDate ? s.createdAt.toDate() : null;
                  const isEditing = editSaleId === s.id;
                  return (
                    <tr key={s.id} className="align-top">
                      <td className="text-xs text-slate-400">{created ? created.toLocaleString() : '—'}</td>
                      <td className="text-xs font-mono text-slate-200">₹{s.total?.toFixed(2)}</td>
                      <td className="text-xs">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            {s.lines.map((l,i)=>{
                              const edit = editLines.find(el=>el.idx===i)!;
                              const k = `${l.itemId || 'line'}-${i}`;
                              return (
                                <div key={k} className="flex gap-2 items-center">
                                  <span className="text-slate-300">#{i+1}</span>
                                  <input type="number" min={1} className="input input-2xs bg-slate-900 w-16" value={edit.quantity} onChange={e=>updateEditLine(i,{ quantity: parseInt(e.target.value,10)||1 })} />
                                  <input type="number" min={0} step="0.01" className="input input-2xs bg-slate-900 w-20" value={edit.price} onChange={e=>updateEditLine(i,{ price: parseFloat(e.target.value)||0 })} />
                                  <span className="text-[10px] text-slate-500">₹{(edit.quantity*edit.price).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <button className="link text-xs" onClick={()=> setShowLinesFor(v=> v===s.id? null : s.id)}>{showLinesFor===s.id? 'Hide' : `${s.lines.length} lines`}</button>
                        )}
                        {showLinesFor === s.id && !isEditing && (
                          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-slate-400">
                            {s.lines.map((l,i)=> {
                              const k = `${l.itemId || 'line'}-${i}`;
                              return <div key={k}>#{i+1} qty {l.quantity} @ ₹{l.price} = ₹{(l.quantity*l.price).toFixed(2)}</div>;
                            })}
                          </div>
                        )}
                      </td>
                      <td className="text-right space-x-1">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 items-end">
                            <button className="btn btn-ghost btn-2xs" disabled={editSubmitting} onClick={saveSaleEdits}>{editSubmitting? 'Saving...' : 'Save'}</button>
                            <button className="btn btn-ghost btn-2xs" onClick={cancelEditSale}>Cancel</button>
                          </div>
                        ) : (
                          <>
                            <button className="btn btn-ghost btn-2xs" onClick={()=>startEditSale(s)}>Edit</button>
                            <button className="btn btn-ghost btn-2xs text-rose-400" onClick={()=>deleteSale(s.id)}>Del</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!sales.length && !loading && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-600 text-sm">No sales</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* Payments Section */}
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-slate-300">Payments</h3>
          <div className="overflow-auto rounded-xl border border-slate-800">
            <table className="table table-xs">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400">
                  <th className="w-40">Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const created = p.createdAt?.toDate ? p.createdAt.toDate() : null;
                  return (
                    <tr key={p.id}>
                      <td className="text-xs text-slate-400">{created ? created.toLocaleString() : '—'}</td>
                      <td className="text-xs font-mono text-emerald-300">₹{p.amount.toFixed(2)}</td>
                      <td className="text-xs text-slate-300">
                        {p.method === 'cash' && '💵'}
                        {p.method === 'upi' && '📱'}
                        {p.method === 'card' && '💳'}
                        {p.method === 'bank' && '🏦'} {p.method || 'cash'}
                      </td>
                      <td className="text-[10px] text-slate-500 max-w-xs truncate" title={p.note || ''}>{p.note || '—'}</td>
                    </tr>
                  );
                })}
                {!payments.length && (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-600 text-sm">No payments</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDetail;
