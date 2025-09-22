import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Logo from '../assets/logoInner.png';

const baseLink = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
const Nav: React.FC = () => {
  const { logout } = useAuth();
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-slate-900/70 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-4 py-2">
        <div className="flex items-center gap-3 pr-4 border-r border-slate-800/60">
          <img src={Logo} alt="OilDrop" className="h-11 w-auto drop-shadow-md select-none" draggable={false} />
          <span className="text-lg font-semibold tracking-wide bg-gradient-to-r from-sky-300 to-emerald-300 bg-clip-text text-transparent drop-shadow-sm">OilDrop</span>
        </div>
        <nav className="flex gap-1">
          <NavLink to="/" end className={({isActive})=> `${baseLink} ${isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/60 hover:text-sky-200'}`}>Dashboard</NavLink>
          <NavLink to="/inventory" className={({isActive})=> `${baseLink} ${isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/60 hover:text-sky-200'}`}>Inventory</NavLink>
          <NavLink to="/customers" className={({isActive})=> `${baseLink} ${isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/60 hover:text-sky-200'}`}>Customers</NavLink>
          <NavLink to="/sales" className={({isActive})=> `${baseLink} ${isActive ? 'bg-slate-800 text-sky-300' : 'text-slate-300 hover:bg-slate-800/60 hover:text-sky-200'}`}>Sales</NavLink>
        </nav>
        <div className="ml-auto">
          <button onClick={logout} className="btn btn-sm btn-ghost text-slate-300 hover:text-white">Logout</button>
        </div>
      </div>
    </header>
  );
};

export default Nav;
