/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import Img from '../assets/Login/loginImg.webp';

export default function LoginPopup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const navigate = useNavigate(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true); 

        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
            });

            // Save the token or handle the response
            localStorage.setItem('token', response.data.token);
            setSuccessMessage('Login successful! Redirecting to home page...');
            setIsLoading(false); 

            // Redirect after success
            setTimeout(() => {
                navigate('/'); 
            }, 2000);

        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            setIsLoading(false); 
            setError('Invalid credentials or user not found');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
                <img
                    src={Img}
                    alt="Login Illustration"
                    className="w-full h-34 mx-auto mb-4 object-cover"
                />
                <h2 className="text-2xl font-semibold mt-7 text-start text-black">Login to continue</h2>
                <p className='mb-7'>Please enter your email and password</p>

                {/* Show success message and redirect if login is successful */}
                {successMessage ? (
                    <div className="text-center">
                        <p className="text-sm text-green-500 mb-4">{successMessage}</p>
                        <button
                            onClick={() => navigate('/')} 
                            className="px-4 py-2 bg-green-600 text-white rounded-md"
                        >
                            OK
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-500 hover:to-orange-300 transition-all text-white rounded-md"
                            disabled={isLoading} 
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                )}

                {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}

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
    );
}
