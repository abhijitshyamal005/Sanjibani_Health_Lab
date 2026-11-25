import { useEffect } from 'react';
import { LoaderCircle, Star, X } from 'lucide-react';
import { LAB_STATUS, STATUS } from '../lib/format';

const BUTTON = {
  primary: 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:from-brand-700 hover:to-brand-600 shadow-sm shadow-brand-700/20',
  accent: 'bg-gradient-to-r from-forest-from to-forest-to text-white hover:brightness-110 shadow-sm shadow-forest-from/30',
  outline: 'border border-slate-200 bg-white text-ink hover:border-brand-300 hover:text-brand-700',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  ghost: 'text-ink-soft hover:bg-slate-100',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
};
const SIZE = {
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  md: 'h-11 px-5 text-sm rounded-xl',
  lg: 'h-12 px-6 text-base rounded-2xl',
};

export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-60 ${BUTTON[variant]} ${SIZE[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, error, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}

const TONES = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/15',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  red: 'bg-red-50 text-red-700 ring-red-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-600/10',
  coral: 'bg-coral-50 text-coral-700 ring-coral-600/15',
};

export function Badge({ tone = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function LabStatusBadge({ status }) {
  const s = LAB_STATUS[status] || { label: status, tone: 'slate' };
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function Rating({ value, count, className = '' }) {
  if (!count) return <span className={`text-xs font-semibold text-ink-muted ${className}`}>New</span>;
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg bg-coral-500 px-1.5 py-0.5 text-xs font-bold text-white ${className}`}>
      {Number(value).toFixed(1)} <Star className="h-3 w-3 fill-current" />
      {count !== undefined && <span className="sr-only">from {count} reviews</span>}
    </span>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex justify-center py-16 ${className}`}>
      <LoaderCircle className="h-7 w-7 animate-spin text-brand-600" aria-label="Loading" />
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="font-semibold text-ink">Couldn’t load this</p>
      <p className="mt-1 text-sm text-ink-muted">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
          <Icon className="h-7 w-7" />
        </div>
      )}
      <p className="text-base font-bold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md';
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-lift sm:rounded-3xl ${width}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    coral: 'bg-coral-50 text-coral-600',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
    sky: 'bg-sky-50 text-sky-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm font-medium text-ink-muted">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-ink sm:text-[1.7rem]">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

/** Minimal accessible bar chart. data: [{ label, value, title? }] */
export function BarChart({ data, height = 160, format = (v) => v, color = 'bg-brand-500' }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }} role="img" aria-label={data.map((d) => `${d.label}: ${format(d.value)}`).join(', ')}>
      {data.map((d) => (
        <div key={d.label} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[11px] font-semibold text-ink-soft opacity-0 transition group-hover:opacity-100">{format(d.value)}</span>
          <div
            className={`w-full max-w-[36px] rounded-t-lg ${color} transition-all group-hover:brightness-110`}
            style={{ height: `${Math.max(4, (d.value / max) * (height - 40))}px` }}
            title={d.title || `${d.label}: ${format(d.value)}`}
          />
          <span className="truncate text-[11px] font-medium text-ink-muted">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`chip ${value === t.value ? 'chip-on' : 'chip-off'}`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`rounded-full px-1.5 text-xs ${value === t.value ? 'bg-white/20' : 'bg-slate-100'}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Payment / refund state of a booking, for patient, lab and admin views. */
export function PaymentBadge({ booking: b }) {
  if (b.refund?.status === 'processed') return <Badge tone="slate">Refunded ₹{b.refund.amount}</Badge>;
  if (b.refund?.status === 'pending') return <Badge tone="amber">Refund ₹{b.refund.amount} pending</Badge>;
  if (b.paymentStatus === 'verifying') return <Badge tone="violet">UPI paid · verifying</Badge>;
  if (b.paymentStatus === 'paid') return <Badge tone="green">{b.paymentMethod === 'upi_direct' ? 'Paid by UPI' : 'Paid'}</Badge>;
  if (b.status === 'cancelled') return null;
  return <Badge tone="amber">Unpaid · pay at collection</Badge>;
}
