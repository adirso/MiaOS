import { NavLink, Outlet } from 'react-router-dom';
import { Header } from './Header';
import '../Layout.css';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/chat', label: 'Chat', end: false },
  { to: '/skills', label: 'Skills', end: false },
  { to: '/configuration', label: 'Configuration', end: false },
  { to: '/integrations', label: 'Integrations', end: false },
];

export function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">Mia</div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'sidebar-link' + (isActive ? ' sidebar-link--active' : '')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Header />
        <div className="main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
