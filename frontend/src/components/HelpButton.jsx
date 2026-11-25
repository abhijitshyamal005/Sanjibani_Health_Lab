import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Headset, Mail, MessageCircle, Phone, X } from 'lucide-react';
import { SUPPORT } from '../lib/support';

/** Floating help button with WhatsApp / call / email shortcuts. */
export default function HelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-64 overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-slate-100" role="dialog" aria-label="Get help">
          <div className="bg-gradient-to-r from-brand-600 to-brand-400 px-4 py-3 text-white">
            <p className="font-bold">Need help?</p>
            <p className="text-xs text-white/85">{SUPPORT.hours}</p>
          </div>
          <div className="p-2">
            {[
              { icon: MessageCircle, label: 'Chat on WhatsApp', href: SUPPORT.whatsappUrl, color: 'text-coral-600' },
              { icon: Phone, label: `Call ${SUPPORT.phone}`, href: `tel:${SUPPORT.phone.replace(/\s/g, '')}`, color: 'text-brand-600' },
              { icon: Mail, label: 'Email support', href: `mailto:${SUPPORT.email}`, color: 'text-sky-600' },
            ].map(({ icon: Icon, label, href, color }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-slate-50">
                <Icon className={`h-5 w-5 ${color}`} /> {label}
              </a>
            ))}
            <Link to="/legal/contact" onClick={() => setOpen(false)} className="block px-3 py-2 text-xs text-ink-muted hover:text-ink">All contact options →</Link>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-forest-from to-forest-to text-white shadow-lift transition hover:scale-105"
        aria-label={open ? 'Close help' : 'Get help'}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
      </button>
    </div>
  );
}
