import { useState } from 'react';
import axios from 'axios';
import Img from '../assets/Login/loginImg.webp';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name,
                email,
                mobile: mobileNumber,
                password
            });
            console.log('Signup successful:', response.data);
            // Handle success (e.g., redirect, show success message)
        } catch (error) {
            console.error('Signup failed:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
                <img 
                    src={Img} 
                    alt="Signup Illustration" 
                    className="w-full h-34 mx-auto mb-4 object-cover"
                />
                <h2 className="text-2xl font-semibold  text-black">Signup in to continue</h2>
                <p className='mb-7 '> This is to verify your Email & Password</p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Enter Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Enter Mobile Number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Enter Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-500 hover:to-orange-300 transition-all text-white rounded-md"
                    >
                        Signup
                    </button>
                </form>
                <p className="text-sm text-center mt-4">
                    Already have an account?{' '}
                    <a href="/login" className="text-green-600 hover:underline">
                        Login
                    </a>
                </p>
                <a
                    href="/"
                    aria-label="Close signup popup"
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                >
                    ✖
                </a>
            </div>
        </div>
    );
}
