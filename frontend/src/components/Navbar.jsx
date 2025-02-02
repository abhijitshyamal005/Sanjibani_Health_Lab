import { useState, useRef, useEffect } from 'react';
import { FaBox, FaChevronDown, FaLocationDot, FaMicroscope } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import { Link } from 'react-router-dom';
import Cart from './Cart';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { cart } = useCart();
  const itemCount = cart?.items?.length || 0;

  const togglePopup = () => {
    setPopupVisible((prev) => !prev);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city); // Update the selected city
    setPopupVisible(false); // Close the dropdown
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setPopupVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 flex items-center justify-between p-4 border-b-2 border-gray-100 bg-white z-50 w-full">
        {/* Left side: Logo and Location */}
        <div className="flex items-center space-x-4 gap-32 md:gap-3">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start space-y-[-4px]">
            <div className="text-orange-400 text-2xl md:text-3xl font-bold">SanjiBani</div>
            <div className="text-green-600 text-xl md:text-2xl">
              Health<span className="text-orange-400 font-semibold">Labs</span>
            </div>
          </Link>

          {/* Location Section (Icon and Text in Two Rows) */}
          <div className="flex flex-col items-start relative" ref={dropdownRef}>
            <div className="flex items-center space-x-1 text-gray-500">
              <FaLocationDot className="h-4 w-5 text-orange-400" />
              <span className="text-xs font-semibold hidden md:block">MY LOCATION</span>
            </div>
            <div
              className="flex items-center space-x-1 cursor-pointer"
              onClick={togglePopup}
            >
              <span className="text-black text-sm">{selectedCity}</span>
              <FaChevronDown className="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Desktop Links and Buttons */}
        <div className="hidden md:flex items-center space-x-4 md:space-x-6">
          <div className="flex items-center space-x-6">
            <Link
              to="/labtest"
              className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-b-lg py-2 px-4"
            >
              <FaMicroscope className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Tests</span>
            </Link>

            <Link
              to="/checkup"
              className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-b-lg py-2 px-4"
            >
              <FaBox className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Checkups</span>
            </Link>
          </div>

          {/* WhatsApp Support */}
          <a
            href="https://wa.me/916296390743"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 border border-green-400 text-green-600 hover:border-green-600 hover:text-green-600 hover:shadow-lg hover:shadow-green-200 transition-all duration-300 rounded-md py-2 px-6"
          >
            <IoLogoWhatsapp className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Support</span>
          </a>

          {/* Cart Button */}
          <button
            className="flex items-center space-x-2 bg-gradient-to-r from-green-800 to-teal-600 text-white rounded-md hover:opacity-90 transition duration-300 py-2 px-6 relative"
            onClick={() => setIsCartOpen(true)}
          >
            <FaShoppingCart className="h-4 w-4" />
            <span className="text-sm font-medium">Cart</span>
            {/* Cart Badge */}
            <div className="absolute -top-2 -right-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {itemCount}
            </div>
          </button>
        </div>
      </nav>

      {/* Popup for City Selection (Centered on Screen) */}
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg w-64">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Select Your City</h2>
              <div className="space-y-2">
                {['Egra', 'Medinipur', 'Contai', 'Haldiya', 'Silighuri'].map((city) => (
                  <span
                    key={city}
                    className="cursor-pointer block bg-white border border-green-600 text-green-600 py-1 px-3 rounded-md hover:text-orange-400 hover:border-orange-400 transition-colors duration-300"
                    onClick={() => handleCitySelect(city)} // Call handleCitySelect with the selected city
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile View Links */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50">
        <div className="flex justify-between items-center py-3 px-6">
          <Link to="/labtest" className="flex flex-col items-center text-gray-600">
            <FaMicroscope className="h-5 w-5" />
            <span className="text-xs font-medium hidden">Tests</span>
          </Link>

          <Link to="/checkup" className="flex flex-col items-center text-gray-600">
            <FaBox className="h-5 w-5" />
            <span className="text-xs font-medium hidden">Checkups</span>
          </Link>

          <a
            href="https://wa.me/916296390743"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-green-600"
          >
            <IoLogoWhatsapp className="h-5 w-5" />
            <span className="text-xs font-medium hidden">Support</span>
          </a>

          <button
            className="flex flex-col items-center text-teal-600 relative"
            onClick={() => setIsCartOpen(true)}
          >
            <FaShoppingCart className="h-5 w-5" />
            {/* Cart Badge for Mobile */}
            <div className="absolute -top-1 -right-2 bg-orange-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-xs">
              {itemCount}
            </div>
            <span className="text-xs font-medium hidden">Cart</span>
          </button>
        </div>
      </div>

      {/* Cart Component */}
      {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}


    </>
  );
};

export default Navbar;