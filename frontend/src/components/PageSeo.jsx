import { useParams } from 'react-router-dom';
import { useSeo } from '../lib/seo';

const LEGAL = {
  terms: ['Terms of Service', 'The terms that apply when you book lab tests through Sanjibani.'],
  privacy: ['Privacy Policy', 'How Sanjibani collects, uses and protects your personal and health information.'],
  refunds: ['Refund & Cancellation Policy', 'How cancellations, rescheduling and refunds work for lab test bookings on Sanjibani.'],
  contact: ['Contact us', 'Get help with a lab test booking, a report or a payment. Reach the Sanjibani support team.'],
};

export function LegalSeo() {
  const { page } = useParams();
  const entry = LEGAL[page];
  useSeo(entry ? { title: entry[0], description: entry[1], path: `/legal/${page}` } : { title: 'Page not found', noindex: true });
  return null;
}

/** Keeps account, checkout and dashboard pages out of search results. */
export function NoIndex() {
  useSeo({ noindex: true });
  return null;
}
