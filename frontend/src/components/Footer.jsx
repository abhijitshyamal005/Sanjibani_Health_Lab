import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { Logo } from './Brand';
import { SUPPORT } from '../lib/support';

export default function Footer() {
  return (
    <footer className="mt-20 bg-brand-950 text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            Compare prices from trusted diagnostic labs near you, book home sample collection in minutes and track your
            report — all in one place.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-coral-400" /> {SUPPORT.phone}
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-coral-400" /> {SUPPORT.email}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-white">For patients</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/labs">Find labs</Link></li>
            <li><Link className="hover:text-white" to="/tests">Compare test prices</Link></li>
            <li><Link className="hover:text-white" to="/bookings">My bookings</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-bold text-white">For labs</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-white" to="/register?role=lab">Register your lab</Link></li>
            <li><Link className="hover:text-white" to="/login">Partner login</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-3 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SUPPORT.company}. Not a substitute for medical advice.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/legal/terms" className="hover:text-white">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/legal/refunds" className="hover:text-white">Refunds & cancellation</Link>
            <Link to="/legal/contact" className="hover:text-white">Contact</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
