import React from 'react';
import Nav from '../components/Nav';

const Card: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div style={{ background: '#fff', padding: '1rem 1.2rem', borderRadius: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minWidth: 180 }}>
    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, color: '#6b7280', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <Nav />
      <main style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <Card title="Inventory Items" value="--" />
        <Card title="Customers" value="--" />
        <Card title="Low Stock" value="--" />
        <Card title="Invoices (Today)" value="--" />
      </main>
    </div>
  );
};

export default Dashboard;
