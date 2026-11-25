/**
 * Business & support details shown in the footer, contact page, help button and policies.
 * Set these via frontend env vars (Vercel → Settings → Environment Variables) before going live.
 */
const env = import.meta.env;
const phone = env.VITE_SUPPORT_PHONE || '+91 90000 00000';
const whatsapp = (env.VITE_SUPPORT_WHATSAPP || phone).replace(/[^\d]/g, '');

export const SUPPORT = {
  company: env.VITE_COMPANY_NAME || 'SanjiBani Health',
  phone,
  whatsappUrl: `https://wa.me/${whatsapp}?text=${encodeURIComponent('Hi SanjiBani, I need help with a lab test booking.')}`,
  email: env.VITE_SUPPORT_EMAIL || 'care@sanjibanilabs.dpdns.org', // patients
  labsEmail: env.VITE_LABS_EMAIL || 'labs@sanjibanilabs.dpdns.org', // lab partners
  paymentsEmail: env.VITE_PAYMENTS_EMAIL || 'payments@sanjibanilabs.dpdns.org', // UPI payments & refunds
  address: env.VITE_COMPANY_ADDRESS || 'Kolkata, West Bengal, India',
  hours: env.VITE_SUPPORT_HOURS || '7 AM – 9 PM, all days',
  grievanceOfficer: env.VITE_GRIEVANCE_OFFICER || 'Grievance Officer',
  jurisdiction: env.VITE_JURISDICTION || 'Kolkata',
};
