import { useState } from "react";
import axios from "axios";
import Img from "../assets/Login/loginImg.webp";
import { setUserDetails } from "../utils/userUtils";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileNumber: "",
    password: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await axios.post(
        "https://sanjibanihealth-lab.onrender.com/api/auth/register",
        formData
      );
      setSuccessMessage("A verification code has been sent to your email.");
    } catch (error) {
      setError(
        "Signup failed: " +
          (error.response?.data?.message || error.message || "Unknown error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        "https://sanjibanihealth-lab.onrender.com/api/auth/verifyemail",
        { email: formData.email, verificationCode }
      );

      if (response.data.token) {
        setIsVerified(true);
        setShowPopup(true);
        setSuccessMessage("Your email has been verified successfully!");

        const user = {
          name: formData.name,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          _id: response.data.userId,
        };
        setUserDetails(user);
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.userId);
      }
    } catch (error) {
      setError(
        "Verification failed: " +
          (error.response?.data?.message || error.message)
      );
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
        <p className="mb-7">This is to verify your information</p>

        {/* Popup after successful verification */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-80">
              <h3 className="text-xl font-bold text-green-600">Success!</h3>
              <p className="text-sm text-gray-700 mt-3">
                Your email has been verified successfully!
              </p>
              <button
                onClick={handleClosePopup}
                className="mt-5 px-4 py-2 bg-green-600 text-white rounded-md"
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Verification Step */}
        {successMessage && !isVerified ? (
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
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </button>
            </form>
          </div>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSubmit}>
            {["name", "email", "mobileNumber", "password"].map((field, i) => (
              <input
                key={i}
                type={field === "password" ? "password" : "text"}
                name={field}
                placeholder={
                  field === "name"
                    ? "Enter Full Name"
                    : field === "email"
                    ? "Enter Email"
                    : field === "mobileNumber"
                    ? "Enter Mobile Number"
                    : "Enter Password"
                }
                value={formData[field]}
                onChange={handleChange}
                className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-700"
                required
              />
            ))}
            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-500 hover:to-orange-300 transition-all text-white rounded-md"
              disabled={isLoading}
            >
              {isLoading ? "Signing up..." : "Signup"}
            </button>
          </form>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center mt-4">{error}</p>
        )}

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-green-600 hover:underline">
            Login
          </a>
        </p>
        <div className="text-center text-xs pt-1 text-gray-500">
          Not a patient?{" "}
          <a
            href="https://sanjibani-health-lab-xvrr.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 underline hover:text-orange-800"
          >
            Log in as an admin
          </a>
        </div>
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
