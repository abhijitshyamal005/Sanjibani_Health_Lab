/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// eslint-disable-next-line react/prop-types, no-unused-vars
const Payment = ({ amount, cartItems, onClose }) => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        try {
            setLoading(true);
            const res = await axios.post('http://localhost:5000/api/payment/orders', {
                amount: amount * 100, // Convert to paise
                currency: "INR"
            });

            const order = res.data;
            
            const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY;
            const isScriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
            
            if (!isScriptLoaded) {
                toast.error('Razorpay SDK failed to load');
                return;
            }

            const options = {
                key: razorpayKey,
                amount: order.amount,
                currency: order.currency,
                name: "Sanjibani HealthLabs",
                description: "Health Checkup Payment",
                order_id: order.id,
                handler: async function(response) {
                    try {
                        await axios.post('http://localhost:5000/api/payment/verify', {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        toast.success('Payment Successful!');
                        onClose();
                        navigate('/order-success');
                    } catch (error) {
                        toast.error('Payment verification failed');
                    }
                },
                prefill: {
                    name: "Customer Name",
                    email: "customer@email.com",
                    contact: "+919999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            toast.error('Payment initialization failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="block w-full text-center bg-gradient-to-r from-green-600 to-green-400 hover:from-green-700 hover:to-green-500 text-white py-3 rounded-lg text-lg font-medium transition-all disabled:opacity-50"
        >
            {loading ? 'Processing...' : 'Pay Now ₹' + amount.toLocaleString()}
        </button>
    );
};

export default Payment;