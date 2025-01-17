/* eslint-disable react/no-unescaped-entities */

import { Link } from 'react-router-dom';
import Img from '../assets/Login/loginImg.webp';

export default function LoginPopup() {

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
    };

    return (
        <div>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
                    <img 
                        src={Img} 
                        alt="Login Illustration" 
                        className="w-full h-34 mx-auto mb-4 object-cover"
                    />
                    <h2 className="text-2xl  font-semibold  mt-7 text-start text-black">Login in to continue</h2>
                    <p className='mb-7 '> This is to verify your Email & Password</p>
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-500 hover:to-orange-300 transition-all text-white rounded-md"
                        >
                            Login
                        </button>
                    </form>
                    <p className="text-sm text-center mt-4">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-green-600 hover:underline">
                            Sign up
                        </Link>
                    </p>
                    <Link
                        to="/"
                        aria-label="Close login popup"
                        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                        ✖
                    </Link>
                </div>
            </div>
        </div>
    );
}
