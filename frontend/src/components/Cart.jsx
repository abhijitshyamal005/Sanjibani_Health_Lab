/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getUserDetails } from "../utils/userUtils";
import { fetchCart, removeItemFromCart } from "../utils/cartUtils";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { MdDeleteSweep } from "react-icons/md";
import { FaShoppingCart } from "react-icons/fa";
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function Cart({ onClose }) {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [userDetail, setUserDetail] = useState(null);

    const { cartVersion, refreshCart } = useCart();
    const user = getUserDetails();

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

    useEffect(() => {
        const loadUser = async () => {
            try {
                const user = await getUserDetails();
                setUserDetail(user);
            } catch (error) {
                setUserDetail(null);
            }
        };
        loadUser();
    }, []);

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
            toast.error(`Removal failed: ${err.message}`);
        }
    };

    const handleNavigation = async () => {
        try {
            const user = await getUserDetails();
            if (!user) {
                toast.error('Please login to proceed');
                navigate('/login');
                onClose();
                return;
            }
            setIsCheckingOut(true);
        } catch (err) {
            toast.error('Please login to proceed');
            navigate('/login');
        }
    };

    if (error) {
        return (
            <div className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl p-4">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="fixed top-0 right-0 h-full w-full sm:w-[440px] bg-[#ebefed] shadow-2xl border-l z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
            <div className="flex justify-between items-center p-6 border-gray-200">
                <p onClick={onClose} className="text-base font-semibold text-gray-800">&lt; Back to home</p>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="h-6 w-6 text-gray-600 hover:text-gray-800" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <p className="text-gray-500">Loading cart...</p>
                ) : cartItems.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-full text-center p-6">
                        <div className="bg-gray-200 p-10 rounded-full mb-4">
                            <FaShoppingCart className="h-40 w-40 text-gray-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700">Your cart is empty. Please add test / checkup to your cart!</p>
                        <p className="mt-4 text-sm text-gray-600">You can explore our services and find the perfect test or checkup for you and your loved ones.</p>
                        <button
                            onClick={() => {
                                onClose();
                                if (!user) navigate("/login");
                            }}
                            className="mt-6 bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-500 text-white py-2 px-6 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
                        >
                            Add test/checkups
                        </button>
                    </div>
                ) : (
                    <div className="p-1">
                        {cartItems.map((item, index) => (
                            <div key={index} className="flex border-t-[0.5px] justify-between items-center p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-sm text-gray-800">{item.productName}</h3>
                                    <div className="text-sm text-gray-600">
                                        <p>Price: ₹{(item.productPrice * item.quantity).toLocaleString()}</p>
                                        <p>Quantity: {item.quantity}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveItem(item.productName, item.productPrice, item._id)} className="text-gray-600 text-xl transition-colors">
                                    <MdDeleteSweep />
                                </button>
                            </div>
                        ))}
                        <div className="flex border-t-[0.5px] justify-between items-center p-2 mt-5 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <Link to="/checkup" className="text-md text-[#01B37A]">Add test/checkups</Link>
                        </div>
                        <p className="mt-5 text-sm ml-1 text-gray-500">Tests added here are for <span className="font-semibold">1 member</span>. You can add or remove members in the next step.</p>
                    </div>
                )}
            </div>
            {cartItems.length > 0 && (
                <div className="bg-[#01B37A] text-white">
                    <p className="text-sm text-center p-2">Get <span className="font-semibold">15% OFF*</span> on 1st order above <span className="font-semibold">₹500</span> Use: <span className="font-semibold text-xs rounded-lg bg-green-600 p-1">SANJIBANI003</span></p>
                </div>
            )}
            {cartItems.length > 0 && (
                <div className="p-6 border-t border-gray-200 bg-white flex flex-col gap-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                            <FaShoppingCart className="text-gray-500 bg-gray-100 h-7 w-7 p-1 rounded-md" />
                            <div>
                                <div className="font-semibold text-lg text-[#01B37A]">₹ {totalPrice.toLocaleString()}</div>
                                <p className="font-semibold text-sm">{cartItems.length} Checkups</p>
                            </div>
                        </div>
                        <div>
                            {!isCheckingOut ? (
                                <button
                                    onClick={handleNavigation}
                                    className="bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-500 text-white py-2 px-6 rounded-lg text-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
                                >
                                    Proceed
                                </button>
                            ) : (
                                <div className="paypal-buttons-container">
                                    <PayPalButtons
                                        style={{ layout: "horizontal" }}
                                        disabled={!userDetail}
                                        createOrder={(data, actions) => {
                                            return actions.order.create({
                                                purchase_units: [
                                                    {
                                                        amount: {
                                                            value: totalPrice.toFixed(2),
                                                            currency_code: "INR"
                                                        }
                                                    }
                                                ]
                                            });
                                        }}
                                        onApprove={async (data, actions) => {
                                            try {
                                                await actions.order.capture();
                                                toast.success("Payment successful!");
                                                await refreshCart();
                                                onClose();
                                                setIsCheckingOut(false);
                                                navigate('/order-success');
                                            } catch (err) {
                                                toast.error("Payment processing failed.");
                                            }
                                        }}
                                        onCancel={() => {
                                            toast.info("Payment cancelled.");
                                            setIsCheckingOut(false);
                                        }}
                                        onError={(err) => {
                                            toast.error("Payment error: " + err.message);
                                            setIsCheckingOut(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}