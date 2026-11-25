/** Share links and ready-made messages for the invite-a-friend and invite-a-lab buttons. */
const origin = () => (typeof window === 'undefined' ? '' : window.location.origin);

export const friendLink = (code) => `${origin()}/register?ref=${encodeURIComponent(code)}`;
export const labLink = (code) => `${origin()}/register?role=lab${code ? `&ref=${encodeURIComponent(code)}` : ''}`;

export const friendMessage = (link, amount = 100) =>
  `I book my lab tests on Sanjibani: compare prices across verified labs and get free home sample collection. Sign up with my link and get ₹${amount} off your booking: ${link}`;

export const labMessage = (link) =>
  `Hello! We'd like to invite your lab to join Sanjibani, an online marketplace where patients compare test prices and book home collection or lab visits.\n\n` +
  `• Free listing, no joining fee\n• New patients from your city\n• Bookings, sample collectors and reports in one dashboard\n• Patients pay directly to your own UPI or at collection\n\n` +
  `Create your lab account in 2 minutes: ${link}`;

export const whatsappUrl = (text) => `https://wa.me/?text=${encodeURIComponent(text)}`;
export const emailUrl = (subject, body) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

/** Copy text to the clipboard; falls back to a hidden textarea where the Clipboard API is blocked. */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}
