import React, { useEffect, useState } from 'react';
import Nav from '../components/Nav';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

interface InventoryItem { id: string; name: string; qty: number; unit: string; }

const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [unit, setUnit] = useState('L');

  useEffect(() => {
    const q = query(collection(db, 'inventory'), orderBy('name'));
    return onSnapshot(q, snap => {
      const list: InventoryItem[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...(doc.data() as any) }));
      setItems(list);
    });
  }, []);

  const addItem = async () => {
    if (!name) return;
    await addDoc(collection(db, 'inventory'), { name, qty, unit });
    setName(''); setQty(0); setUnit('L');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Nav />
      <main style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <h2>Inventory</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input placeholder='Name' value={name} onChange={e => setName(e.target.value)} />
          <input placeholder='Qty' type='number' value={qty} onChange={e => setQty(parseFloat(e.target.value))} style={{ width: 90 }} />
          <select value={unit} onChange={e => setUnit(e.target.value)}>
            <option value='L'>L</option>
            <option value='ML'>ML</option>
            <option value='PC'>PC</option>
          </select>
          <button onClick={addItem}>Add</button>
        </div>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Qty</th>
              <th style={{ padding: 8 }}>Unit</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: 8 }}>{it.name}</td>
                <td style={{ padding: 8 }}>{it.qty}</td>
                <td style={{ padding: 8 }}>{it.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};

export default Inventory;
