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
                    setLoading(false);
                    return;
                }

                const cartData = await fetchCart(token);
                setCart(cartData); // Update context cart
                if (cartData?.items) {
                    setCartItems(cartData.items);
                    setTotalPrice(cartData.totalPrice || calculateTotal(cartData.items));
                }
            } catch (err) {
                setError('Failed to load cart');
            } finally {
                setLoading(false);
            }
        };

        loadCartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartVersion]);

    useEffect(() => {
        const loadCartData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const cartData = await fetchCart(token);
                if (cartData && cartData.items) {
                    setCartItems(cartData.items);
                    setTotalPrice(cartData.totalPrice || calculateTotal(cartData.items));
                }
            } catch (err) {
                setError('Failed to load cart');
                toast.error('Failed to load cart items');
            } finally {
                setLoading(false);
            }
        };

        loadCartData();
    }, []);

    const calculateTotal = (items) => {
        return items.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
    };

    const handleRemoveItem = async (productName, productPrice) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Session expired. Please login again.');
                navigate('/login');
                return;
            }
    
            // Convert to number and validate
            const numericPrice = Number(productPrice);
            if (isNaN(numericPrice)) {
                toast.error('Invalid product price format');
                return;
            }
    
            await removeItemFromCart(productName, numericPrice, token);
            
            // Update state using refreshCart from context
            refreshCart();
            
            toast.success('Item removed successfully');
        } catch (err) {
            console.error('Remove Item Error:', err);
            const errorMessage = err.message.includes('Failed to fetch') 
                ? 'Network error - check your connection'
                : err.message;
            toast.error(`Removal failed: ${errorMessage}`);
        }
    };

    const handleNavigation = async () => {
        try {
            const user = await getUserDetails();
            onClose();
            
            if (cartItems.length > 0) {
                navigate(user ? "/checkout" : "/login");
            } else {
                navigate(user ? "/" : "/signup");
            }
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
        <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-300 transform translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b bg-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Your Cart..</h2>
                <button onClick={onClose}>
                    <X className="h-6 w-6 text-green-600 hover:text-red-500 transition-all" />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                {loading ? (
                    <p className="text-gray-500">Loading cart...</p>
                ) : cartItems.length === 0 ? (
                    <p className="text-gray-500 text-lg">Your cart is currently empty. Book a service now!</p>
                ) : (
                    <div className="space-y-4">
                        {cartItems.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border-b pb-4">
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-800">{item.productName}</h3>
                                    <div className="text-sm text-gray-500">
                                        <p>Price: ₹{item.productPrice.toLocaleString()}</p>
                                        <p>Quantity: {item.quantity}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 ml-4">
                                    <span className="font-medium">
                                        ₹{(item.productPrice * item.quantity).toLocaleString()}
                                    </span>
                                    <button 
                                        onClick={() => handleRemoveItem(item.productName, item.productPrice)}
                                        className="text-red-500 hover:text-red-700 text-2xl"
                                    >
                                        <MdDeleteSweep />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t bg-white">
                {cartItems.length > 0 && (
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-lg">Total:</span>
                        <span className="font-semibold text-lg">
                            ₹{totalPrice.toLocaleString()}
                        </span>
                    </div>
                )}
                
                <button
                    onClick={handleNavigation}
                    className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-400 text-white py-3 rounded-lg text-lg font-medium transition-all"
                >
                    {cartItems.length > 0 ? "Proceed to Checkout" : "Book Your LabTests & Checkups"}
                </button>
            </div>
        </div>
    );
}