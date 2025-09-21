import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const linkStyle: React.CSSProperties = { padding: '0.5rem 0.9rem', borderRadius: 6, textDecoration: 'none', color: '#1f2937', fontWeight: 500 };

const Nav: React.FC = () => {
  const { logout } = useAuth();
  return (
    <header style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '0.75rem 1.25rem', background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>OilDrop</div>
      <nav style={{ display: 'flex', gap: 4 }}>
        <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
        <NavLink to="/inventory" style={linkStyle}>Inventory</NavLink>
        <NavLink to="/customers" style={linkStyle}>Customers</NavLink>
        <NavLink to="/sales" style={linkStyle}>Sales</NavLink>
      </nav>
      <div style={{ marginLeft: 'auto' }}>
        <button onClick={logout} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.45rem 0.9rem', borderRadius: 6, cursor: 'pointer' }}>Logout</button>
      </div>
    </header>
  );
};

export default Nav;
