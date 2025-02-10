/* eslint-disable react/prop-types */

import { toast } from "react-toastify";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { X } from "lucide-react";

const PaymentPopup = ({
    totalPrice,
    cartItems,
    refreshCart,
    onClose,
    navigate,
    onPaymentSuccess
}) => {
    const handlePaymentSuccess = async () => {
        await refreshCart();
        onPaymentSuccess();
        toast.success("Payment successful! Order created.");
        navigate("/order-confirmation");
        onClose();
    };

    // Calculate total amount in INR without rounding individual items
    const totalINR = (totalPrice / 100).toFixed(2);
    const paypalAmount = parseFloat(totalINR).toFixed(2);

    return (
        <div className="fixed inset-0 z-[100] bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
                >
                    <X className="h-6 w-6 text-gray-600" />
                </button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Complete Payment</h2>
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                            ₹{totalPrice.toLocaleString()}
                        </span>
                    </div>
                    <PayPalScriptProvider
                        options={{
                            "client-id": "AYA4vJgrg54Mhqr1FKcYFHZmUmjEMon2oRdyt_3pABUJyTn5-docprQHJDjJco2bSJZUf1rtWaTua0fS",
                            currency: "INR",
                            components: "buttons",
                        }}
                    >
                        <div className="mt-6">
                            <PayPalButtons
                                style={{
                                    layout: "vertical",
                                    color: "gold",
                                    shape: "rect",
                                    label: "paypal"
                                }}
                                createOrder={(data, actions) => {
                                    const itemsTotal = cartItems.reduce((sum, item) => {
                                        return sum + (item.productPrice * item.quantity) / 100;
                                    }, 0).toFixed(2);
                                    if (parseFloat(itemsTotal) !== parseFloat(paypalAmount)) {
                                        toast.error("Order total mismatch. Please refresh the page.");
                                        throw new Error("Order total mismatch");
                                    }
                                    return actions.order.create({
                                        purchase_units: [{
                                            amount: {
                                                value: paypalAmount,
                                                currency_code: "INR",
                                                breakdown: {
                                                    item_total: {
                                                        value: itemsTotal,
                                                        currency_code: "INR"
                                                    }
                                                }
                                            },
                                            items: cartItems.map(item => ({
                                                name: item.productName.substring(0, 127), // PayPal item name limit
                                                unit_amount: {
                                                    value: (item.productPrice / 100).toFixed(2),
                                                    currency_code: "INR"
                                                },
                                                quantity: item.quantity.toString(),
                                                category: "PHYSICAL_GOODS"
                                            }))
                                        }]
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    try {
                                        const details = await actions.order.capture();
                                        const token = localStorage.getItem('token');
                                        const response = await fetch('/api/orders', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                paymentId: details.id,
                                                amount: totalPrice,
                                                items: cartItems
                                            })
                                        });
                                        if (!response.ok) throw new Error('Failed to create order');
                                        handlePaymentSuccess();
                                    } catch (err) {
                                        toast.error(`Payment failed: ${err.message}`);
                                    }
                                }}
                                onError={(err) => {
                                    toast.error("Payment failed. Please try again.");
                                    console.error("PayPal Error:", err);
                                }}
                            />
                        </div>
                    </PayPalScriptProvider>
                </div>
                
                <div className="mt-8 border-t pt-4">
                    <p className="text-sm text-gray-600 mb-3">Other payment methods:</p>
                    <button
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                        disabled
                    >
                        Upi / Scanner Payment (Coming Soon)
                    </button>
                </div>
            </div>
            <div className="fixed inset-0 z-[-1] bg-black opacity-50" onClick={onClose}>
            </div>
        </div>
    );
};

export default PaymentPopup;