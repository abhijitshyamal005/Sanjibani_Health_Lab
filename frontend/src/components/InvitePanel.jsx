import { useState } from 'react';
import { Check, Copy, Gift, Mail, MessageCircle, Share2, Store, Ticket, UserPlus, Users } from 'lucide-react';
import { Badge, Button, ErrorState, Spinner } from './ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { inr, shortDate } from '../lib/format';
import { copyText, emailUrl, friendLink, friendMessage, labLink, labMessage, whatsappUrl } from '../lib/invite';
import { useAsync } from '../lib/useAsync';

const STATE = {
  available: { tone: 'green', label: 'Ready to use' },
  used: { tone: 'slate', label: 'Used' },
  expired: { tone: 'red', label: 'Expired' },
  inactive: { tone: 'slate', label: 'Inactive' },
};

function useCopy() {
  const { toast } = useApp();
  const [copied, setCopied] = useState('');
  const copy = async (key, text, message) => {
    if (await copyText(text)) {
      setCopied(key);
      toast(message);
      setTimeout(() => setCopied((k) => (k === key ? '' : k)), 2000);
    } else {
      toast('Could not copy. Select the text and copy it yourself.', 'error');
    }
  };
  return { copied, copy };
}

/** A read-only link with Copy, WhatsApp, Share and Email buttons. */
export function ShareLink({ id, link, message, subject, copyLabel = 'Copy link' }) {
  const { copied, copy } = useCopy();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  return (
    <div>
      <div className="flex gap-2">
        <input className="input min-w-0 flex-1 bg-white font-mono text-xs sm:text-sm" value={link} readOnly aria-label="Invite link" data-testid={`${id}-link`} onFocus={(e) => e.target.select()} />
        <Button type="button" onClick={() => copy('link', link, 'Link copied')} className="shrink-0" data-testid={`${id}-copy`}>
          {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="hidden sm:inline">{copied === 'link' ? 'Copied' : copyLabel}</span>
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={whatsappUrl(message)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-3.5 py-2 text-sm font-semibold text-white hover:bg-[#15803d]" data-testid={`${id}-whatsapp`}>
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        {canShare && (
          <button type="button" onClick={() => navigator.share({ title: subject, text: message }).catch(() => {})} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
            <Share2 className="h-4 w-4" /> Share
          </button>
        )}
        <a href={emailUrl(subject, message)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
          <Mail className="h-4 w-4" /> Email
        </a>
        <button type="button" onClick={() => copy('msg', message, 'Message copied')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-slate-50" data-testid={`${id}-copy-message`}>
          {copied === 'msg' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy message
        </button>
      </div>
    </div>
  );
}

function CouponRow({ c }) {
  const { copied, copy } = useCopy();
  const s = STATE[c.state] || STATE.inactive;
  return (
    <li className="flex flex-wrap items-center gap-3 py-3" data-testid="invite-coupon">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-coral-50 text-coral-600">
        <Ticket className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-sm font-bold tracking-wide">{c.code}</p>
        <p className="text-xs text-ink-muted">
          {inr(c.value)} off{c.minOrder ? ` on ${inr(c.minOrder)}+` : ''}
          {c.expiresAt && c.state === 'available' ? ` · valid till ${shortDate(c.expiresAt)}` : ''}
        </p>
      </div>
      <Badge tone={s.tone}>{s.label}</Badge>
      {c.state === 'available' && (
        <button type="button" onClick={() => copy(c.code, c.code, 'Coupon code copied')} className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-brand-700" aria-label={`Copy ${c.code}`}>
          {copied === c.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      )}
    </li>
  );
}

/**
 * Invite friends (and labs) with a personal link. Shown to every signed-in user:
 * friends get ₹100 off; patients also earn ₹100 when a friend completes their first booking.
 */
export default function InvitePanel({ showLabInvite = true }) {
  const { data, loading, error, reload } = useAsync(() => api('/invites/me'), []);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;

  const amount = data.reward.amount;
  const link = friendLink(data.code);
  const message = friendMessage(link, amount);

  return (
    <div className="space-y-6" data-testid="invite-panel">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#14532d] to-[#0f766e] p-5 text-white sm:p-7">
        <div className="flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 sm:grid">
            <Gift className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {data.earnsReward ? `Invite friends, you both get ${inr(amount)} off` : `Invite friends, they get ${inr(amount)} off`}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {data.earnsReward
                ? `Friends who sign up with your link get ${inr(amount)} off a booking. When their first booking is completed, you get ${inr(amount)} off too.`
                : `Share Sanjibani with family, patients and colleagues. Everyone who signs up with your link gets ${inr(amount)} off a booking.`}
            </p>
          </div>
        </div>
        <div className="mt-5 rounded-2xl bg-white/10 p-3 sm:p-4 [&_.input]:border-white/30">
          <ShareLink id="invite" link={link} message={message} subject={`Get ${inr(amount)} off lab tests on Sanjibani`} />
        </div>
        <p className="mt-3 text-xs text-white/70">
          Your invite code: <span className="font-mono font-bold tracking-wider text-white" data-testid="invite-code">{data.code}</span> · Coupons work on bookings of {inr(data.reward.minOrder)} or more and are valid for {data.reward.validDays} days.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><UserPlus className="h-5 w-5" /></span>
          <div>
            <p className="text-2xl font-extrabold" data-testid="invite-joined">{data.joined}</p>
            <p className="text-xs font-medium text-ink-muted">{data.joined === 1 ? 'Friend joined' : 'Friends joined'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral-50 text-coral-600"><Users className="h-5 w-5" /></span>
          <div>
            <p className="text-2xl font-extrabold">{data.rewarded}</p>
            <p className="text-xs font-medium text-ink-muted">{data.earnsReward ? 'Rewards earned' : 'Completed a booking'}</p>
          </div>
        </div>
      </div>

      <section className="card p-5">
        <h3 className="font-bold">How it works</h3>
        <ol className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          {[
            'Share your link on WhatsApp, email or anywhere.',
            `Your friend signs up and gets a ${inr(amount)} coupon by email.`,
            data.earnsReward ? `When their first booking is completed, you get a ${inr(amount)} coupon.` : 'They use it at checkout on their first booking.',
          ].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
              <span className="text-ink-soft">{t}</span>
            </li>
          ))}
        </ol>
      </section>

      {data.coupons.length > 0 && (
        <section className="card p-5">
          <h3 className="font-bold">Your invite coupons</h3>
          <p className="text-xs text-ink-muted">Enter the code at checkout. Each coupon works once.</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {data.coupons.map((c) => <CouponRow key={c.code} c={c} />)}
          </ul>
        </section>
      )}

      {showLabInvite && (
        <section className="card p-5" data-testid="lab-invite-card">
          <div className="mb-3 flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Store className="h-5 w-5" /></span>
            <div>
              <h3 className="font-bold">Know a laboratory? Invite it</h3>
              <p className="text-sm text-ink-muted">Send this link to a lab owner or manager. Listing is free and they go live after a quick verification.</p>
            </div>
          </div>
          <ShareLink id="lab-invite" link={labLink(data.code)} message={labMessage(labLink(data.code))} subject="Invitation: list your lab on Sanjibani" />
        </section>
      )}
    </div>
  );
}

/** Ready-to-use invite coupons as one-tap chips at checkout. */
export function MyInviteCoupons({ onApply, current }) {
  const { data } = useAsync(() => api('/invites/me').catch(() => null), []);
  const ready = (data?.coupons || []).filter((c) => c.state === 'available' && c.code !== current);
  if (!ready.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {ready.map((c) => (
        <button key={c.code} type="button" onClick={() => onApply(c.code)} className="inline-flex items-center gap-1.5 rounded-lg bg-coral-50 px-2.5 py-1 text-xs font-semibold text-coral-700 ring-1 ring-coral-200 hover:bg-coral-100" data-testid="my-coupon-chip">
          <Ticket className="h-3.5 w-3.5" /> Use {c.code}: {inr(c.value)} off
        </button>
      ))}
    </div>
  );
}
