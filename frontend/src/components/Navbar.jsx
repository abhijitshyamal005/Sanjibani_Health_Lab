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

  const cities = ['Kolkata', 'Howrah', 'Salt Lake', 'New Town', 'Durgapur'];

  const togglePopup = () => setPopupVisible(prev => !prev);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setPopupVisible(false);
  };

  const handleClickOutside = (event) => {
    event.stopPropagation();
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setPopupVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Main Navigation Bar */}
      <nav className="sticky top-0 flex items-center justify-between p-4 border-b-2 border-gray-100 bg-white z-50 w-full">

        {/* Left Section - Logo and Location */}
        <div className="flex items-center space-x-4 gap-32 md:gap-3">
          {/* Logo */}
          <Link to="/" className="flex flex-col items-start space-y-[-4px]">
            <span className="text-orange-400 text-2xl font-bold">SanjiBani</span>
            <span className="text-green-600 text-xl">
              Health<span className="text-orange-400">Labs</span>
            </span>
          </Link>

          {/* Location Selector */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col cursor-pointer" onClick={togglePopup}>
              <div className="flex items-center gap-1 text-gray-500">
                <FaLocationDot className="text-orange-400" />
                <span className="text-xs font-semibold hidden md:block">MY LOCATION</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm">{selectedCity}</span>
                <FaChevronDown className="text-gray-500" />
              </div>
            </div>

            {/* City Selection Popup */}
            {isPopupVisible && (
              <div className="absolute top-full right-4 md:left-0  mt-9 w-48 bg-white border rounded-lg shadow-lg">
                <div className="p-3">
                  <h3 className="text-sm font-semibold mb-2">Select City</h3>
                  <div className="space-y-2">
                    {cities.map(city => (
                      <div
                        key={city}
                        onClick={() => handleCitySelect(city)}
                        className={`p-2 text-sm rounded-md cursor-pointer ${selectedCity === city
                          ? 'bg-green-100 text-green-700'
                          : 'hover:bg-gray-100'}`}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Navigation Items */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-4 ">
            <Link
              to="/labtest"
              className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-orange-300 transition-all duration-300 rounded-b-lg py-2 px-4"
            >
              <FaMicroscope className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Tests</span>
            </Link>

            <Link
              to="/checkup"
              className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-green-300 transition-all duration-300 rounded-b-lg py-2 px-4"
            >
              <FaBox className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">Checkups</span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://wa.me/916296390743"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 border border-green-400 text-green-600 hover:border-green-600 hover:text-green-600 hover:shadow-lg hover:shadow-green-500 transition-all duration-300 rounded-md py-2 px-6"
            >
              <IoLogoWhatsapp className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Support</span>
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-800 to-teal-600 text-white rounded-md hover:opacity-90 transition duration-300 py-2 px-6 relative"
            >
              <FaShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t shadow-lg z-50">
          <div className="flex justify-around py-3">
            <Link to="/labtest" className="text-gray-600">
              <FaMicroscope className="text-xl" />
            </Link>
            <Link to="/checkup" className="text-gray-600">
              <FaBox className="text-xl" />
            </Link>
            <a
              href="https://wa.me/916296390743"
              target="_blank"
              rel="noreferrer"
              className="text-green-600"
            >
              <IoLogoWhatsapp className="text-xl" />
            </a>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative text-green-600"
            >
              <FaShoppingCart className="text-xl" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Cart Modal */}
      {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Navbar;