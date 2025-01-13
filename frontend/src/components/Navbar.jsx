import { useState, useRef } from 'react';
import { FaBox, FaChevronDown, FaLocationDot, FaMicroscope } from "react-icons/fa6";
import { FaShoppingCart } from "react-icons/fa";
import { IoLogoWhatsapp } from "react-icons/io";
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isPopupVisible, setPopupVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Kolkata');
  const dropdownRef = useRef(null);

  const togglePopup = () => {
    setPopupVisible(!isPopupVisible);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setPopupVisible(false);
  };

  return (
    <nav className="sticky top-0 flex items-center justify-between p-4 border-b-2 border-gray-100 bg-white z-50 w-full">
      {/* Left side: Logo (Desktop) */}
      <div className="hidden md:flex items-center space-x-4 md:space-x-10">
        <Link to='/' className="flex flex-col items-start space-y-[-4px]">
          <div className="text-orange-400 text-3xl font-bold">SanjiBani</div>
          <div className="text-green-600 text-2xl">
            Health<span className="text-orange-400 font-semibold">Labs</span>
          </div>
        </Link>
        <div className="flex flex-col items-start relative">
          <div className="flex items-center space-x-1 text-gray-500">
            <FaLocationDot className="h-4 w-5 text-orange-400" />
            <span className="text-xs font-semibold">MY LOCATION</span>
          </div>
          <div
            className="flex items-center space-x-1 cursor-pointer"
            onClick={togglePopup}
            ref={dropdownRef}
          >
            <span className="text-black ml-5 text-sm">{selectedCity}</span>
            <FaChevronDown className="h-4 w-4 text-gray-500" />
          </div>

          {/* Popup */}
          {isPopupVisible && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg w-64">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Select Your City</h2>
                <div className="space-y-2">
                  {['Egra', 'Medinipur', 'Contai', 'Haldiya', 'Silighuri'].map((city) => (
                    <span
                      key={city}
                      className="cursor-pointer block bg-white border border-green-600 text-green-600 py-1 px-3 rounded-md hover:text-orange-400 hover:border-orange-400 transition-colors duration-300"
                      onClick={() => handleCitySelect(city)}
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side: Links and Buttons (Desktop) */}
      <div className="hidden md:flex items-center space-x-6">
        <Link to='/labtest' className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-b-lg py-2 px-4">
          <FaMicroscope className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">Tests</span>
        </Link>

        <Link to='/checkup' className="flex items-center space-x-2 text-gray-600 hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-b-lg py-2 px-4">
          <FaBox className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">Checkups</span>
        </Link>

        <a
          href="https://wa.me/916296390743"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-2 border border-green-400 text-green-600 hover:border-green-600 hover:text-green-600 hover:shadow-lg hover:shadow-green-200 transition-all duration-300 rounded-md py-2 px-6"
        >
          <IoLogoWhatsapp className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Support</span>
        </a>


        <button className="flex items-center space-x-2 bg-gradient-to-r from-green-800 to-teal-600 text-white rounded-md hover:opacity-90 transition duration-300 py-2 px-6">
          <FaShoppingCart className="h-4 w-4" />
          <span className="text-sm font-medium">Cart</span>
        </button>
      </div>

      {/* Mobile view */}
      <div className="md:hidden flex items-center gap-16 w-full">
        <Link to='/' className="flex items-center space-x-1">
          <div className="text-orange-400 text-xl font-bold">SanjiBani</div>
          <div className="text-green-600 text-xl">
            Health<span className="text-orange-400 font-semibold">Labs</span>
          </div>
        </Link>
        <div className="flex items-center space-x-2">
          <button className="flex items-center text-green-600 hover:text-green-800 transition duration-300 py-1 px-1">
            <FaLocationDot className="h-4 w-4" />
          </button>
          <button className="flex items-center text-green-600 hover:text-green-800 transition duration-300 py-1 px-1">
            <IoLogoWhatsapp className="h-4 w-4" />
          </button>
          <button className="flex items-center text-green-600 hover:text-green-800 transition duration-300 py-1 px-1">
            <FaShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Popup */}
      {isPopupVisible && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
          <div className="bg-white border border-gray-300 rounded-lg shadow-lg w-80 p-4">
            <h2 className="text-lg font-semibold mb-4">Select Your City</h2>
            <div className="space-y-2">
              {['Egra', 'Medinipur', 'Contai', 'Haldiya', 'Silighuri'].map((city) => (
                <span
                  key={city}
                  className="cursor-pointer block bg-white border border-green-600 text-green-600 py-1 px-3 rounded-md hover:text-orange-400 hover:border-orange-400 transition-colors duration-300"
                  onClick={() => handleCitySelect(city)}
                >
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
