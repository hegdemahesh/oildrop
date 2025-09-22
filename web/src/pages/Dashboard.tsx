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
          <Stat label="Inventory Items" value="--" accent="text-sky-400" />
          <Stat label="Customers" value="--" accent="text-indigo-400" />
          <Stat label="Low Stock" value="--" accent="text-amber-400" />
          <Stat label="Invoices (Today)" value="--" accent="text-emerald-400" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <section className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 flex flex-col gap-4 min-h-[240px]">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300">Recent Invoices</h3>
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No invoices yet</div>
          </section>
          <section className="bg-slate-800/50 rounded-xl border border-slate-700 p-5 flex flex-col gap-4 min-h-[240px]">
            <h3 className="text-sm font-semibold tracking-wide text-slate-300">Low Stock Alerts</h3>
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">All good • No low stock items</div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
