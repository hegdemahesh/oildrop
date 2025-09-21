import React, { useState } from 'react';
import Nav from '../components/Nav';

interface Line { id: string; name: string; qty: number; price: number; }

const Sales: React.FC = () => {
  const [lines, setLines] = useState<Line[]>([]);
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);

  const addLine = () => {
    if (!name) return;
    setLines(l => [...l, { id: Math.random().toString(36).slice(2), name, qty, price }]);
    setName(''); setQty(1); setPrice(0);
  };

  const subtotal = lines.reduce((s, l) => s + l.qty * l.price, 0);
  const tax = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Nav />
      <main style={{ padding: '1.5rem', maxWidth: 900, margin: '0 auto' }}>
        <h2>Sales Draft</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input placeholder='Item' value={name} onChange={e => setName(e.target.value)} />
          <input placeholder='Qty' type='number' value={qty} onChange={e => setQty(parseFloat(e.target.value))} style={{ width: 80 }} />
            <input placeholder='Price' type='number' value={price} onChange={e => setPrice(parseFloat(e.target.value))} style={{ width: 100 }} />
          <button onClick={addLine}>Add</button>
        </div>
        <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#e5e7eb' }}>
              <th style={{ padding: 8 }}>Item</th>
              <th style={{ padding: 8 }}>Qty</th>
              <th style={{ padding: 8 }}>Price</th>
              <th style={{ padding: 8 }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(l => (
              <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td style={{ padding: 8 }}>{l.name}</td>
                <td style={{ padding: 8 }}>{l.qty}</td>
                <td style={{ padding: 8 }}>{l.price}</td>
                <td style={{ padding: 8 }}>{(l.qty * l.price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
          <div><strong>Subtotal:</strong> {subtotal.toFixed(2)}</div>
          <div><strong>GST (18%):</strong> {tax.toFixed(2)}</div>
          <div><strong>Total:</strong> {total.toFixed(2)}</div>
        </div>
      </main>
    </div>
  );
};

export default Sales;
