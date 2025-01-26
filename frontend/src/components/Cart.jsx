import { X } from "lucide-react";
import { Link } from "react-router-dom";

// eslint-disable-next-line react/prop-types
export default function Cart({ onClose }) {
    return (
        <div
            className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white shadow-2xl border-l border-gray-300 transform translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col`}
        >
            <div className="flex justify-between items-center p-4 border-b bg-gray-100">
                <h2 className="text-xl font-semibold text-gray-800">Shopping Cart</h2>
                <button onClick={onClose}>
                    <X className="h-6 w-6 text-green-600 hover:text-red-500 transition-all" />
                </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
                <p className="text-gray-500 text-lg">Your cart is currently empty.</p>
            </div>

            <div className="p-4 border-t bg-white">
                <Link 
                    to={'/labtest'}
                    onClick={onClose}
                    className="block w-full text-center bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-400 text-white py-3 rounded-lg text-lg font-medium transition-all"
                >
                    Book Your LabTests & Checkups
                </Link>
            </div>
        </div>
    );
}
