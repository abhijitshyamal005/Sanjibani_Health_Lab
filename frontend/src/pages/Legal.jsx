import { Link, NavLink, useParams } from 'react-router-dom';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { NotFound } from './Auth';
import { SUPPORT } from '../lib/support';

/*
 * Policy templates. Have the text reviewed by a lawyer before launch; business details come from src/lib/support.js.
 * live payments. Replace the details in src/lib/support.js and have the text reviewed by a lawyer before launch.
 */
const UPDATED = '25 November 2026';

const PAGES = {
  terms: {
    title: 'Terms of Service',
    body: [
      ['About Sanjibani', `${SUPPORT.company} (“Sanjibani”, “we”) operates an online marketplace that lets patients discover independent diagnostic laboratories (“Labs”), compare test prices and book sample collection. Sanjibani is not a laboratory and does not perform tests, interpret results or give medical advice. Each Lab is solely responsible for the tests it performs, its pricing, sample collection and reports.`],
      ['Accounts', 'You must give accurate information and keep your password confidential. You are responsible for all activity on your account. You must be 18 or older, or book under the supervision of a parent or guardian.'],
      ['Bookings', 'A booking is a request to the Lab for the listed tests at the selected slot. The Lab may confirm, reschedule or cancel a booking (for example, if a slot or test becomes unavailable). Prices shown at checkout, including any home collection fee and coupon discount, are the final amount payable.'],
      ['Payments', 'You can pay by UPI (to the UPI ID shown at checkout — either the Lab’s or SanjiBani’s) and submit your UPI transaction ID, or pay at the time of collection. A UPI payment is confirmed once the receiver verifies it. We never ask for your UPI PIN, card or bank details.'],
      ['Labs on Sanjibani', 'Labs must hold valid registrations and accreditations they display, keep prices and test details accurate, follow applicable laws on sample handling and patient confidentiality, and deliver reports in the stated time.'],
      ['Medical disclaimer', 'Test results must be interpreted by a qualified doctor. Do not use Sanjibani for medical emergencies — call 112 or visit the nearest hospital.'],
      ['Liability', 'To the extent permitted by law, Sanjibani is not liable for the acts or omissions of Labs, including the quality or accuracy of tests and reports. Our total liability for any claim is limited to the amount you paid through Sanjibani for the booking in question.'],
      ['Changes & governing law', `We may update these terms; continued use means you accept the updated terms. These terms are governed by the laws of India and courts at ${SUPPORT.jurisdiction} have exclusive jurisdiction.`],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    body: [
      ['What we collect', 'Account details (name, email, mobile number), patient details you enter for a booking (name, age, gender, phone), collection address, booking history, reviews, and reports uploaded by Labs. For UPI payments we store only the UPI transaction ID you submit — never your UPI PIN or bank details.'],
      ['Why we use it', 'To create and manage bookings, share the necessary details with the Lab you book, send booking and report notifications, provide support, prevent fraud and comply with law. We do not sell your personal data.'],
      ['Health data', 'Test names and reports are sensitive personal data. They are shared only with the Lab handling your booking and are accessible only to you, that Lab and authorised Sanjibani staff for support. Reports are stored encrypted at rest with our cloud provider.'],
      ['Your rights (DPDP Act, 2023)', `You can access, correct or delete your personal data, and withdraw consent, by emailing ${SUPPORT.email}. We may retain booking records where the law requires.`],
      ['Security', 'Passwords are hashed, connections use HTTPS, and access is role-restricted. No system is perfectly secure; tell us immediately if you suspect misuse of your account.'],
      ['Grievance officer', `${SUPPORT.grievanceOfficer}, ${SUPPORT.email}, ${SUPPORT.phone}. We respond within 30 days.`],
    ],
  },
  refunds: {
    title: 'Refund & Cancellation Policy',
    body: [
      ['Cancelling a booking', 'You can cancel a booking from “My bookings” any time before the sample is collected. After sample collection a booking cannot be cancelled.'],
      ['Refunds for UPI payments', `If you paid by UPI and the booking is cancelled by you before sample collection, or by the Lab for any reason, the full amount is refunded to the UPI account you paid from within 3 working days. Questions about a payment or refund: ${SUPPORT.paymentsEmail}.`],
      ['Partial refunds', 'If a Lab is unable to perform one of the booked tests, the price of that test is refunded.'],
      ['Pay at collection', 'If you chose to pay at collection, nothing is charged until the sample is collected, so no refund is needed for cancellations.'],
      ['Report issues', `If your report is delayed beyond the stated time or you have a complaint about a Lab, contact us at ${SUPPORT.email} — we will work with the Lab to resolve it.`],
    ],
  },
};

const TABS = [
  ['terms', 'Terms'],
  ['privacy', 'Privacy'],
  ['refunds', 'Refunds'],
  ['contact', 'Contact'],
];

function Contact() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { icon: Phone, label: 'Call us', value: SUPPORT.phone, href: `tel:${SUPPORT.phone.replace(/\s/g, '')}` },
        { icon: MessageCircle, label: 'WhatsApp', value: SUPPORT.phone, href: SUPPORT.whatsappUrl },
        { icon: Mail, label: 'Patient support', value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
        { icon: Mail, label: 'Lab partners', value: SUPPORT.labsEmail, href: `mailto:${SUPPORT.labsEmail}` },
        { icon: Mail, label: 'Payments & refunds', value: SUPPORT.paymentsEmail, href: `mailto:${SUPPORT.paymentsEmail}` },
        { icon: MapPin, label: 'Office', value: SUPPORT.address },
      ].map(({ icon: Icon, label, value, href }) => (
        <div key={label} className="card flex gap-4 p-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">{label}</p>
            {href ? <a href={href} className="break-words font-bold text-ink hover:text-brand-700">{value}</a> : <p className="font-bold text-ink">{value}</p>}
          </div>
        </div>
      ))}
      <p className="text-sm text-ink-muted sm:col-span-2">Support hours: {SUPPORT.hours}. For lab partnerships, <Link to="/register?role=lab" className="font-semibold text-brand-700">register your lab</Link>.</p>
    </div>
  );
}

export default function Legal() {
  const { page } = useParams();
  const content = PAGES[page];
  if (!content && page !== 'contact') return <NotFound />;
  return (
    <div className="container-page max-w-4xl py-10">
      <div className="scrollbar-none -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
        {TABS.map(([slug, label]) => (
          <NavLink key={slug} to={`/legal/${slug}`} className={({ isActive }) => `chip ${isActive ? 'chip-on' : 'chip-off'}`}>{label}</NavLink>
        ))}
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">{page === 'contact' ? 'Contact us' : content.title}</h1>
      {page !== 'contact' && <p className="mt-1 text-sm text-ink-muted">Last updated {UPDATED}</p>}
      <div className="mt-8">
        {page === 'contact' ? (
          <Contact />
        ) : (
          <div className="card space-y-6 p-6 sm:p-8">
            {content.body.map(([h, p]) => (
              <section key={h}>
                <h2 className="font-bold text-ink">{h}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p}</p>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
