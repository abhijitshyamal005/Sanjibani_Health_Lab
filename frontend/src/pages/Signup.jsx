import { useState } from "react";
import axios from "axios";
import Img from "../assets/Login/loginImg.webp";
import { setUserDetails } from "../utils/userUtils";

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [userId , setUserId ] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                name,
                email,
                mobileNumber,
                password
            });

            setSuccessMessage('A verification code has been sent to your email.');
        } catch (error) {
            setError('Signup failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/verifyemail', {
                email,
                verificationCode
            });

            if (response.data.token) {
                setIsVerified(true);
                setShowPopup(true);
                setSuccessMessage('Your email has been verified successfully! You can now login.');
                setUserId(response.data.userId);

              
                const user = { name, email, mobileNumber };
                setUserDetails(user); 
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('userId', userId);
            } else {
                setError('Invalid verification code.');
            }
        } catch (error) {
            setError('Verification failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        window.location.href = "/";
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-96 relative">
                <img
                    src={Img}
                    alt="Signup Illustration"
                    className="w-full h-34 mx-auto mb-4 object-cover"
                />
                <h2 className="text-2xl font-semibold text-black">Signup to continue</h2>
                <p className='mb-7'>This is to verify your information</p>

                {/* Success popup after verification */}
                {showPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-80">
                            <h3 className="text-xl font-bold text-green-600">Success!</h3>
                            <p className="text-sm text-gray-700 mt-3">Your email has been verified successfully!</p>
                            <button
                                onClick={handleClosePopup}
                                className="mt-5 px-4 py-2 bg-green-600 text-white rounded-md"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                )}

                {successMessage && !isVerified && (
                    <div className="text-center">
                        <p className="text-sm text-orange-600 mb-4">{successMessage}</p>
                        <form onSubmit={handleVerifyCode}>
                            <input
                                type="text"
                                placeholder="Enter Verification Code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-600 text-white rounded-md"
                            >
                                Verify
                            </button>
                        </form>
                    </div>
                )}

                {!successMessage && (
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
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing up...' : 'Signup'}
                        </button>
                    </form>
                )}

                {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
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
