/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserDetails } from "../utils/userUtils";
import { fetchCart, removeItemFromCart } from "../utils/cartUtils";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { MdDeleteSweep } from "react-icons/md";

export default function Cart({ onClose }) {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
     
    const { cart, setCart, cartVersion } = useCart();
    const { refreshCart } = useCart();

    useEffect(() => {
        const loadCartData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setCartItems([]);
                    setTotalPrice(0);
                    return;
                }
                const cartData = await fetchCart(token);
                if (cartData?.items) {
                    setCartItems(cartData.items);
                    setTotalPrice(cartData.totalPrice || 0);
                }
            } catch (err) {
                setError('Failed to load cart');
            } finally {
                setLoading(false);
            }
        };

        loadCartData();
    }, [cartVersion]);

    const handleRemoveItem = async (productName, productPrice, _id) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }

            await removeItemFromCart(productName, productPrice, token, _id);
            await refreshCart();
            toast.success('Item removed successfully');
        } catch (err) {
            console.error('Remove Item Error:', err);
            toast.error(`Removal failed: ${err.message}`);
        }
    };

    const handleNavigation = async () => {
        try {
            const user = await getUserDetails();
            onClose();
            navigate(cartItems.length > 0 ? "/checkout" : user ? "/" : "/login");
        } catch (err) {
            toast.error('Navigation failed');
        }
    };

    if (error) {
        return (
            <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl p-4">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white">
                <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <p className="text-gray-500">Loading cart...</p>
                ) : cartItems.length === 0 ? (
                    <p className="text-gray-500 text-lg text-center">Your cart is empty. Book a service now!</p>
                ) : (
                    <div className="space-y-6">
                        {cartItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                                    <div className="text-sm text-gray-600">
                                        <p>Price: ₹{item.productPrice.toLocaleString()}</p>
                                        <p>Quantity: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-medium text-gray-800">
                                        ₹{(item.productPrice * item.quantity).toLocaleString()}
                                    </span>
                                    <button
                                        onClick={() => handleRemoveItem(item.productName, item.productPrice, item._id)}
                                        className="text-red-500 hover:text-red-700 text-2xl transition-colors"
                                    >
                                        <MdDeleteSweep />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-white">
                {cartItems.length > 0 && (
                    <div className="flex justify-between items-center mb-6">
                        <span className="font-semibold text-lg text-gray-800">Total:</span>
                        <span className="font-semibold text-lg text-gray-800">
                            ₹{totalPrice.toLocaleString()}
                        </span>
                    </div>
                )}
                <button
                    onClick={handleNavigation}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white py-3 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
                >
                    {cartItems.length > 0 ? "Proceed to Checkout" : "Book Your LabTests & Checkups"}
                </button>
            </div>
        </div>
    );
}