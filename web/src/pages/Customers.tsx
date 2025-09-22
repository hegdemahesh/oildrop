import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';

interface Customer { id: string; name: string; phone?: string | null; createdAt?: unknown }

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
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

  const addCustomer = async () => {
    setError(null);
    if (!name.trim()) { setError('Name required'); return; }
    setSubmitting(true);
    try {
      const fn = httpsCallable(functions, 'addCustomer');
      await fn({ name: name.trim(), phone: phone.trim() || undefined });
      setName(''); setPhone('');
    } catch (e: any) {
      setError(e.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold text-slate-200">Customers</h2>
          <p className="text-sm text-slate-500">Manage customer directory</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label htmlFor="cust-name" className="text-xs text-slate-400 mb-1">Name *</label>
            <input id="cust-name" className="input input-sm input-bordered bg-slate-900 w-60" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="cust-phone" className="text-xs text-slate-400 mb-1">Phone</label>
            <input id="cust-phone" className="input input-sm input-bordered bg-slate-900 w-52" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <button onClick={addCustomer} disabled={submitting} className="btn btn-primary btn-sm mt-5">{submitting ? 'Adding...' : 'Add Customer'}</button>
        </div>
        {error && <div className="alert alert-error py-2 h-10 min-h-0 text-sm">{error}</div>}
        <div className="bg-slate-800/40 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra-zebra w-full">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400 bg-slate-800/60">
                  <th>Name</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td>{c.name}</td>
                    <td className="font-mono text-xs text-slate-300">{c.phone || <span className="text-slate-600">—</span>}</td>
                  </tr>
                ))}
                {!customers.length && (
                  <tr>
                    <td colSpan={2} className="text-center py-10 text-slate-500 text-sm">No customers yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Customers;
