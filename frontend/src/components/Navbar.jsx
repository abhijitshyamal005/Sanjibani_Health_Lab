import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { initials } from '../lib/format';
import { Logo } from './Brand';

export function CitySelect({ className = '' }) {
  const { meta, city, setCity } = useApp();
  return (
    <label className={`relative flex items-center ${className}`}>
      <MapPin className="pointer-events-none absolute left-3 h-4 w-4 text-coral-500" />
      <span className="sr-only">City</span>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-ink focus:border-brand-500 focus:outline-none"
        data-testid="city-select"
      >
        <option value="">All cities</option>
        {(meta?.cities || []).map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-ink-muted" />
    </label>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const links =
    user.role === 'admin'
      ? [{ to: '/admin', label: 'Admin dashboard', icon: LayoutDashboard }]
      : user.role === 'lab'
        ? [{ to: '/partner', label: 'Lab dashboard', icon: LayoutDashboard }]
        : user.role === 'collector'
          ? [{ to: '/collector', label: 'My collection jobs', icon: LayoutDashboard }]
        : [
            { to: '/bookings', label: 'My bookings', icon: ClipboardList },
            { to: '/profile', label: 'My profile', icon: UserRound },
          ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-slate-100"
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="user-menu"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-800">{initials(user.name)}</span>
        <span className="hidden max-w-[120px] truncate text-sm font-semibold lg:block">{user.name.split(' ')[0]}</span>
        <ChevronDown className="h-4 w-4 text-ink-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 shadow-lift">
          <div className="border-b border-slate-100 px-4 pb-2.5 pt-1.5">
            <p className="truncate text-sm font-bold">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
          </div>
          {links.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
              <Icon className="h-4 w-4 text-ink-muted" /> {label}
            </Link>
          ))}
          <button
            role="menuitem"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const cart = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navLink = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:text-ink'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo />
        <CitySelect className="ml-2 hidden md:flex" />
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          <NavLink to="/labs" className={navLink}>
            Labs
          </NavLink>
          <NavLink to="/tests" className={navLink}>
            Compare tests
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <Link to="/tests" className="grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-slate-100 md:hidden" aria-label="Search tests">
            <Search className="h-5 w-5" />
          </Link>
          {(!user || user.role === 'patient') && (
            <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-soft hover:bg-slate-100" aria-label={`Cart, ${cart.count} items`} data-testid="cart-link">
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[11px] font-bold text-white">{cart.count}</span>
              )}
            </Link>
          )}
          {!user && (
            <Link to="/register?role=lab" className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 lg:flex">
              <Store className="h-4 w-4" /> Register your lab
            </Link>
          )}
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/login" className="hidden h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 sm:flex">
              Log in
            </Link>
          )}
          <button className="grid h-10 w-10 place-items-center rounded-xl hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            <CitySelect className="mb-2" />
            <NavLink to="/labs" className={navLink}>
              Labs
            </NavLink>
            <NavLink to="/tests" className={navLink}>
              Compare tests
            </NavLink>
            {!user && (
              <>
                <NavLink to="/register?role=lab" className={navLink}>
                  Register your lab
                </NavLink>
                <NavLink to="/login" className={navLink}>
                  Log in
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
