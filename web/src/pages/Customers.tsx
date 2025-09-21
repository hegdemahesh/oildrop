import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface Customer { id: string; name: string; phone?: string; }

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: Customer[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setCustomers(list);
    });
  }, []);

  const addCustomer = async () => {
    if (!name) return;
    await addDoc(collection(db, 'customers'), { name, phone });
    setName(''); setPhone('');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Nav />
      <main style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <h2>Customers</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input placeholder='Name' value={name} onChange={e => setName(e.target.value)} />
          <input placeholder='Phone' value={phone} onChange={e => setPhone(e.target.value)} />
          <button onClick={addCustomer}>Add</button>
        </div>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: 8 }}>{c.name}</td>
                <td style={{ padding: 8 }}>{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Customers;
