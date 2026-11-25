import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CircleCheck, Copy, Smartphone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { inr } from '../lib/format';
import { Button, Field, Spinner } from './ui';

const isPhone = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

/**
 * Free direct-UPI payment: shows the lab's UPI QR / "Open UPI app" link,
 * then collects the 12-digit UTR for the lab to confirm.
 */
export default function UpiPay({ booking, onSubmitted }) {
  const { toast } = useApp();
  const [info, setInfo] = useState(null);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const [utr, setUtr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    api(`/payments/upi/${booking._id}`)
      .then(async (d) => {
        if (!alive) return;
        setInfo(d);
        setQr(await QRCode.toDataURL(d.uri, { margin: 1, width: 240, color: { dark: '#1f2937', light: '#ffffff' } }));
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [booking._id]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api(`/payments/upi/${booking._id}/submit`, { method: 'POST', body: { utr } });
      toast('Thanks! The lab will confirm your payment shortly.');
      onSubmitted?.(res.booking);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!info) return <Spinner className="py-6" />;

  return (
    <div className="space-y-4" data-testid="upi-pay">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {qr && <img src={qr} alt={`UPI QR code to pay ${inr(info.amount)} to ${info.payee}`} className="h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2" />}
        <div className="flex-1 space-y-2 text-sm">
          <p className="text-2xl font-extrabold text-ink">{inr(info.amount)}</p>
          <p>
            Pay to <b>{info.payee}</b>
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(info.upiId).then(() => toast('UPI ID copied'))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-sm hover:bg-slate-200"
          >
            {info.upiId} <Copy className="h-3.5 w-3.5" />
          </button>
          <p className="text-xs text-ink-muted">Note: {info.note} · No extra charges</p>
          {isPhone() ? (
            <a href={info.uri} className="mt-1 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-forest-from to-forest-to px-4 text-sm font-bold text-white">
              <Smartphone className="h-4 w-4" /> Open UPI app
            </a>
          ) : (
            <p className="text-xs text-ink-muted">Scan the QR with Google Pay, PhonePe, Paytm or any UPI app.</p>
          )}
        </div>
      </div>
      <form onSubmit={submit} className="rounded-2xl bg-slate-50 p-4">
        <Field label="After paying, enter the 12-digit UPI transaction ID (UTR)" hint="Find it in your UPI app under transaction details">
          <input
            className="input font-mono tracking-wider"
            inputMode="numeric"
            maxLength={14}
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/[^\d ]/g, ''))}
            placeholder="e.g. 412356789012"
            name="utr"
            required
          />
        </Field>
        <Button type="submit" className="mt-3 w-full" loading={saving} data-testid="submit-utr">
          <CircleCheck className="h-4 w-4" /> I have paid
        </Button>
      </form>
    </div>
  );
}
