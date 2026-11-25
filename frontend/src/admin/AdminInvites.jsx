import { useState } from 'react';
import { Mail, Send, Store } from 'lucide-react';
import InvitePanel, { ShareLink } from '../components/InvitePanel';
import { Badge, Button, EmptyState, ErrorState, Field, PageHeader, Spinner } from '../components/ui';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { dateTime } from '../lib/format';
import { labLink, labMessage } from '../lib/invite';
import { useAsync } from '../lib/useAsync';

const EMPTY = { labName: '', email: '', contactName: '', note: '' };

function InviteLabForm({ onSent }) {
  const { toast } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const { invite } = await api('/invites/labs', { method: 'POST', body: form });
      toast(`Invite sent to ${invite.email}`);
      setForm(EMPTY);
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-5" data-testid="lab-invite-form">
      <div>
        <h2 className="font-bold">Email an invitation</h2>
        <p className="text-sm text-ink-muted">The lab gets a branded email explaining the benefits, with a button to create their partner account.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lab name">
          <input className="input" value={form.labName} onChange={set('labName')} required maxLength={120} name="labName" />
        </Field>
        <Field label="Lab email">
          <input className="input" type="email" value={form.email} onChange={set('email')} required name="labEmail" />
        </Field>
        <Field label="Contact person" hint="Optional: used in the greeting">
          <input className="input" value={form.contactName} onChange={set('contactName')} maxLength={80} name="contactName" />
        </Field>
        <Field label="Personal note" hint="Optional: added to the email">
          <input className="input" value={form.note} onChange={set('note')} maxLength={500} name="note" />
        </Field>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700" role="alert">{error}</p>}
      <Button type="submit" loading={sending}>
        <Send className="h-4 w-4" /> Send invite
      </Button>
    </form>
  );
}

function SentInvites({ state }) {
  const { data, loading, error, reload } = state;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Spinner />;
  if (!data.items.length) return <EmptyState icon={Mail} title="No invites sent yet" text="Labs you invite by email appear here, and show as joined once they register." />;
  return (
    <div className="card overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {data.items.map((i) => (
          <li key={i._id} className="flex flex-wrap items-center gap-3 p-4" data-testid="lab-invite-row">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><Store className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{i.labName}</p>
              <p className="truncate text-xs text-ink-muted">
                {i.contactName ? `${i.contactName} · ` : ''}{i.email}
              </p>
            </div>
            <div className="text-right text-xs text-ink-muted">
              <p>Sent {dateTime(i.lastSentAt)}</p>
              {i.sendCount > 1 && <p>{i.sendCount} times</p>}
            </div>
            <Badge tone={i.joined ? 'green' : 'amber'}>{i.joined ? 'Joined' : 'Invited'}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** /admin/invites — invite laboratories by email or link, and share your own friend invite. */
export default function AdminInvites() {
  const sent = useAsync(() => api('/invites/labs'), []);
  const link = labLink();
  return (
    <>
      <PageHeader title="Invite labs" subtitle="Bring laboratories onto Sanjibani: send a branded email, or share the template on WhatsApp." />
      <div className="grid gap-6 xl:grid-cols-2">
        <InviteLabForm onSent={sent.reload} />
        <section className="card p-5">
          <h2 className="font-bold">Message template</h2>
          <p className="mb-3 text-sm text-ink-muted">Copy it or send it straight to a lab on WhatsApp.</p>
          <pre className="mb-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-3 font-sans text-sm text-ink-soft" data-testid="lab-invite-template">{labMessage(link)}</pre>
          <ShareLink id="admin-lab" link={link} message={labMessage(link)} subject="Invitation: list your lab on Sanjibani" />
        </section>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-bold">Invites sent</h2>
      <SentInvites state={sent} />
      <h2 className="mb-3 mt-10 text-lg font-bold">Invite friends</h2>
      <InvitePanel showLabInvite={false} />
    </>
  );
}
