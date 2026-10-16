import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/employees', label: 'Employees', icon: '👷' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/services', label: 'Services', icon: '🛠' },
  { to: '/attendance', label: 'Attendance', icon: '🗓' },
  { to: '/salary', label: 'Employee Salary', icon: '₹' },
  { to: '/locations', label: 'Employee Locations', icon: '📍' },
  { to: '/sites', label: 'Site Names', icon: '🏭' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
  { to: '/junior-admins', label: 'Junior Admins', icon: '🛡', superOnly: true },
];

export default function Layout() {
  const { user, isSuper, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.superOnly || isSuper);

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-logo">☀</span>
          <div>
            <div className="brand-name">Solar Service</div>
            <div className="brand-sub">{isSuper ? 'SuperAdmin Panel' : 'Junior Admin Panel'}</div>
          </div>
        </div>
        <nav className="nav">
          {items.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="nav-link logout" onClick={() => logout()}>
          <span className="nav-icon" aria-hidden="true">⎋</span> Logout
        </button>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <header className="topbar">
          <button type="button" className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu">☰</button>
          <div className="topbar-spacer" />
          <div className="user-chip">
            <span className="avatar">{(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}</span>
            <div className="user-meta">
              <strong>{user?.name || user?.email || `User #${user?.id}`}</strong>
              <small>{isSuper ? 'SuperAdmin' : `Junior Admin #${user?.id}`}</small>
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
