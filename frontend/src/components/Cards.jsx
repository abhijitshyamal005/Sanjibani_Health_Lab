import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Check, Clock, House, MapPin, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { categoryMeta } from '../lib/categories';
import { inr } from '../lib/format';
import { LabCover } from './Brand';
import { Badge, Button, Modal, Rating } from './ui';

export function LabCard({ lab }) {
  return (
    <Link to={`/labs/${lab.slug}`} className="group card overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lift" data-testid="lab-card">
      <LabCover lab={lab} className="h-32" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold leading-snug text-ink group-hover:text-brand-700">{lab.name}</h3>
          <Rating value={lab.rating} count={lab.ratingCount} />
        </div>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5" /> {[lab.address?.area, lab.address?.city].filter(Boolean).join(', ')}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lab.accreditations?.slice(0, 2).map((a) => (
            <Badge key={a} tone="brand">
              <BadgeCheck className="h-3 w-3" /> {a}
            </Badge>
          ))}
          {lab.assistedVisit && <Badge tone="violet">Assisted visit</Badge>}
          {lab.homeCollection && (
            <Badge tone="coral">
              <House className="h-3 w-3" /> {lab.homeCollectionFee ? `Home ${inr(lab.homeCollectionFee)}` : 'Free home collection'}
            </Badge>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
          <span className="flex items-center gap-1 text-ink-muted">
            <Clock className="h-3.5 w-3.5" /> {lab.reportTime}
          </span>
          {lab.minPrice != null && (
            <span className="text-ink-muted">
              Tests from <span className="font-bold text-ink">{inr(lab.minPrice)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Add-to-cart with the "replace cart?" prompt when switching labs. */
export function useAddToCart() {
  const cart = useCart();
  const { user } = useAuth();
  const { toast } = useApp();
  const [pending, setPending] = useState(null);

  const add = (lab, test) => {
    if (user && user.role !== 'patient') {
      toast('Switch to a patient account to book tests', 'error');
      return;
    }
    const result = cart.add(lab, test);
    if (result === 'conflict') setPending({ lab, test });
    else toast(`${test.name} added to cart`);
  };

  const modal = (
    <Modal
      open={!!pending}
      onClose={() => setPending(null)}
      title="Replace cart?"
      footer={
        <>
          <Button variant="outline" onClick={() => setPending(null)}>
            Keep current
          </Button>
          <Button
            variant="accent"
            onClick={() => {
              cart.replaceWith(pending.lab, pending.test);
              toast(`Cart now has tests from ${pending.lab.name}`);
              setPending(null);
            }}
          >
            Replace
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-soft">
        Your cart has tests from <b>{cart.lab?.name}</b>. You can book from one lab at a time. Clear the cart and add{' '}
        <b>{pending?.test.name}</b> from <b>{pending?.lab.name}</b>?
      </p>
    </Modal>
  );

  return { add, modal, has: cart.has };
}

export function AddButton({ added, onAdd, size = 'sm' }) {
  return added ? (
    <Button variant="soft" size={size} onClick={(e) => e.preventDefault()} aria-label="Added to cart">
      <Check className="h-4 w-4" /> Added
    </Button>
  ) : (
    <Button variant="outline" size={size} onClick={onAdd} className="border-brand-600 text-brand-700 hover:bg-brand-50" data-testid="add-to-cart">
      <Plus className="h-4 w-4" /> Add
    </Button>
  );
}

/** A test inside a lab's catalogue. */
export function TestRow({ test, lab, cartApi }) {
  const [open, setOpen] = useState(false);
  const meta = categoryMeta(test.category);
  const Icon = meta.icon;
  return (
    <div className="flex gap-4 py-5" data-testid="test-row">
      <div className={`hidden h-12 w-12 shrink-0 place-items-center rounded-xl sm:grid ${meta.color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {test.isPopular && <Badge tone="coral">Bestseller</Badge>}
          {test.type === 'package' && <Badge tone="violet">Package</Badge>}
        </div>
        <h4 className="mt-1 font-bold text-ink">{test.name}</h4>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-bold">{inr(test.price)}</span>
          {test.mrp > test.price && (
            <>
              <span className="text-sm text-ink-muted line-through">{inr(test.mrp)}</span>
              <span className="text-sm font-semibold text-brand-600">{test.discount}% off</span>
            </>
          )}
        </div>
        <p className="mt-1.5 text-sm text-ink-muted">
          {test.parameters?.length ? `${test.parameters.length} parameters · ` : ''}
          {test.sampleType !== 'None' ? `${test.sampleType} sample · ` : ''}Report in {test.reportTime}
          {!test.homeCollection && ' · Lab visit only'}
        </p>
        <button onClick={() => setOpen((o) => !o)} className="mt-1 text-sm font-semibold text-brand-700 hover:underline">
          {open ? 'Hide details' : 'View details'}
        </button>
        {open && (
          <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-ink-soft">
            {test.description && <p>{test.description}</p>}
            <p className="mt-2">
              <span className="font-semibold text-ink">Preparation:</span> {test.preparation}
            </p>
            {test.parameters?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {test.parameters.map((p) => (
                  <span key={p} className="rounded-lg bg-white px-2 py-1 text-xs ring-1 ring-slate-200">
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 pt-6">
        <AddButton added={cartApi.has(test._id)} onAdd={() => cartApi.add(lab, test)} />
      </div>
    </div>
  );
}

/** One lab's offer for a test, on the compare page. */
export function OfferCard({ test, cartApi }) {
  const navigate = useNavigate();
  const lab = test.lab;
  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center" data-testid="offer-card">
      <button onClick={() => navigate(`/labs/${lab.slug}`)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <LabCover lab={lab} className="h-14 w-14 shrink-0 rounded-xl [&>div]:hidden" />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-muted">{test.name}</p>
          <p className="truncate font-bold text-ink hover:text-brand-700">{lab.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
            <Rating value={lab.rating} count={lab.ratingCount} />
            <span>{lab.address?.area}, {lab.address?.city}</span>
            <span>· Report {test.reportTime}</span>
            {lab.accreditations?.[0] && <span>· {lab.accreditations.join(', ')}</span>}
          </p>
        </div>
      </button>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="text-lg font-extrabold">{inr(test.price)}</p>
          {test.mrp > test.price && (
            <p className="text-xs">
              <span className="text-ink-muted line-through">{inr(test.mrp)}</span>{' '}
              <span className="font-semibold text-brand-600">{test.discount}% off</span>
            </p>
          )}
        </div>
        <AddButton added={cartApi.has(test._id)} onAdd={() => cartApi.add(lab, test)} />
      </div>
    </div>
  );
}

export function CategoryTile({ category, onClick, active }) {
  const meta = categoryMeta(category.name);
  const Icon = meta.icon;
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-center gap-2 rounded-2xl border bg-white p-3 text-center sm:p-4 transition hover:-translate-y-0.5 hover:shadow-card ${
        active ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200/70'
      }`}
    >
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${meta.color} transition group-hover:scale-105`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="text-xs font-bold leading-tight text-ink sm:text-sm">{category.name}</span>
      {category.minPrice != null && <span className="text-xs text-ink-muted">from {inr(category.minPrice)}</span>}
    </button>
  );
}
