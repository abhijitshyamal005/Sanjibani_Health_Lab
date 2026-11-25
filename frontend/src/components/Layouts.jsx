import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ExternalLink, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { initials } from '../lib/format';
import { useSeoDefaults } from '../lib/seo';
import { Logo } from './Brand';
import Footer from './Footer';
import HelpButton from './HelpButton';
import Navbar from './Navbar';
import { Spinner } from './ui';

export function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useSeoDefaults(pathname);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <HelpButton />
    </div>
  );
}

/** Guards a route by login and (optionally) role. */
export function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Spinner className="min-h-[60vh] items-center" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/** Sidebar shell shared by the lab partner and admin dashboards. */
export function DashboardShell({ nav, title, badge, headerExtra, children }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => { setOpen(false); }, [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo to={nav[0]?.to} suffix={title} />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {nav.map(({ to, label, icon: Icon, end, count }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:bg-brand-50 hover:text-brand-800'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="flex-1">{label}</span>
            {count > 0 && <span className="rounded-full bg-coral-600 px-2 text-xs font-bold text-white">{count}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink-muted hover:bg-slate-50">
          <ExternalLink className="h-4 w-4" /> Go to website
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-800">{initials(user?.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="rounded-lg p-2 text-ink-muted hover:bg-white hover:text-red-600"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200/70 bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-lift">{sidebar}</aside>
        </div>
      )}
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-3">{badge}</div>
        {headerExtra}
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
    </div>
  );
}
