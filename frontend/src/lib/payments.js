import { api } from './api';

let scriptPromise = null;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = resolve;
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the payment window. Check your connection.'));
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout for a booking.
 * Resolves with the updated booking when paid, or null if the patient closed the window.
 */
export async function payForBooking(bookingId) {
  const order = await api('/payments/order', { method: 'POST', body: { bookingId } });
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: 'SanjiBani Health',
      description: `Booking #${order.bookingCode}`,
      prefill: order.prefill,
      theme: { color: '#f97316' },
      handler: async (resp) => {
        try {
          const { booking } = await api('/payments/verify', { method: 'POST', body: { bookingId, ...resp } });
          resolve(booking);
        } catch (e) {
          reject(e);
        }
      },
      modal: { ondismiss: () => resolve(null) },
    });
    rzp.on('payment.failed', (r) => reject(new Error(r?.error?.description || 'Payment failed. Please try again.')));
    rzp.open();
  });
}
