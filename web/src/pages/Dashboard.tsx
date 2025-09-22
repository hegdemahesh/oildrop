import React from 'react';
import Nav from '../components/Nav';

const Stat: React.FC<{ label: string; value: string | number; accent?: string }> = ({ label, value, accent }) => (
  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-col gap-1 min-w-[180px]">
    <span className="text-[10px] tracking-wide uppercase text-slate-400 font-semibold">{label}</span>
    <span className={`text-2xl font-bold ${accent || 'text-slate-200'}`}>{value}</span>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <Nav />
      <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-200">Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Realtime operational snapshot</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Stat label="Inventory Items" value={152} accent="text-sky-400" />
          <Stat label="Customers" value={37} accent="text-indigo-400" />
          <Stat label="Low Stock" value={5} accent="text-amber-400" />
          <Stat label="Invoices (Today)" value={12} accent="text-emerald-400" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 flex flex-col gap-4 min-h-[260px]">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300">Recent Invoices</h3>
            <ul className="space-y-3 text-sm">
              {[
                { id: 'INV-1042', customer: 'Hegde Automobiles', total: 18450, status: 'Paid', ts: '09:10' },
                { id: 'INV-1041', customer: 'Ravi Motors', total: 9720, status: 'Partial', ts: '08:55' },
                { id: 'INV-1040', customer: 'Sunrise Auto Care', total: 22110, status: 'Unpaid', ts: '08:32' },
                { id: 'INV-1039', customer: 'Coastal Trucks', total: 6400, status: 'Paid', ts: 'Yesterday' },
              ].map(r => {
                let badgeClass = 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
                if (r.status === 'Paid') badgeClass = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
                else if (r.status === 'Partial') badgeClass = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
                return (
                  <li key={r.id} className="flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{r.id}</span>
                      <span className="text-slate-500 text-xs">{r.customer}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-300">₹{(r.total/100).toLocaleString('en-IN',{minimumFractionDigits:2})}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium tracking-wide ${badgeClass}`}>{r.status}</span>
                      <span className="text-[10px] text-slate-500 w-14 text-right">{r.ts}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 flex flex-col gap-4 min-h-[260px]">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300">Low Stock Alerts</h3>
            <ul className="space-y-3 text-sm">
              {[
                { name: 'Engine Oil 20W40 (1L)', brand: 'Castrol', qty: 4 },
                { name: 'Brake Fluid DOT4 (500ml)', brand: 'Bosch', qty: 6 },
                { name: 'Coolant Premix (1L)', brand: 'Shell', qty: 3 },
                { name: 'Grease Multi-purpose (500g)', brand: '3M', qty: 5 },
                { name: 'Gear Oil EP90 (1L)', brand: 'Mobil', qty: 2 },
              ].map(item => (
                <li key={item.name} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200">{item.name}</span>
                    <span className="text-slate-500 text-[10px] uppercase tracking-wide">{item.brand}</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 px-2 py-0.5 rounded-full">Qty {item.qty}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
