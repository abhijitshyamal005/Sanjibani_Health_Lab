/* eslint-disable react/no-unknown-property */
import { FaBox, FaMicroscope } from 'react-icons/fa6';
import { LuSearch } from "react-icons/lu";
import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa';
import heroImg from '../assets/hero4.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-8 md:py-12">
      {/* Hero Image Container */}
      <div className="container mx-auto px-4">
        <div className="relative flex justify-center">
          <img
            src={heroImg}
            alt="Medical tests illustration"
            className="w-full max-w-[1100px] object-contain relative z-10"
          />

          {/* Animated Blurred Balls */}
          <div className="absolute top-8 left-[15%] w-16 h-16 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall1 z-0 sm:left-1/4 sm:w-20 sm:h-20"></div>
          <div className="absolute top-12 left-[65%] w-12 h-12 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall2 z-0 sm:left-2/3"></div>
          <div className="absolute bottom-8 right-[15%] w-20 h-20 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall3 z-0 sm:right-1/4 sm:w-24 sm:h-24"></div>
        </div>

        {/* Search and CTA Section */}
        <div className="bg-white bg-opacity-10 backdrop-blur-lg py-6 px-4 sm:px-8 rounded-2xl shadow-lg max-w-4xl mx-auto -mt-8 sm:-mt-16 relative z-20">
          <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6">
            {/* Search Input */}
            <div className="relative w-full lg:flex-1">
              <input
                type="text"
                placeholder="Search for tests"
                className="w-full px-4 py-3 pr-12 text-base rounded-xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 placeholder-gray-400"
              />
              <LuSearch className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6" />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 sm:gap-4">
              <Link
                to="/labtest"
                className="flex items-center justify-center gap-2 text-white bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-600 hover:to-orange-500 transition-all duration-300 rounded-xl py-3 px-6 text-sm sm:text-base font-medium whitespace-nowrap"
              >
                <span>Lab Tests</span>
                <FaMicroscope className="h-5 w-5" />
              </Link>

              <Link
                to="/checkup"
                className="flex items-center justify-center gap-2 text-white bg-gradient-to-r from-green-900 to-teal-700 hover:from-green-700 hover:to-green-600 transition-all duration-300 rounded-xl py-3 px-6 text-sm sm:text-base font-medium whitespace-nowrap"
              >
                <span>Checkups</span>
                <FaBox className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Promotion Text */}
        <div className="text-center text-sm sm:text-base text-gray-600 mt-4 sm:mt-6">
          Get <span className="text-orange-500 font-medium">15% OFF*</span> on orders above{' '}
          <span className="font-semibold">₹500</span> | Use:{' '}
          <span className="font-semibold">RXTU4569</span>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="flex items-center p-4 sm:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-orange-100 flex items-center justify-center">
              <FaFlask className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            </div>
            <div className="ml-4 sm:ml-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">In-house labs</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">NABL certified</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center p-4 sm:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-orange-100 flex items-center justify-center">
              <FaClock className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            </div>
            <div className="ml-4 sm:ml-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">60 mins collection</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">6 AM - 10 PM</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center p-4 sm:p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-orange-100 flex items-center justify-center">
              <FaFileAlt className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            </div>
            <div className="ml-4 sm:ml-6">
              <h3 className="text-base sm:text-lg font-medium text-gray-800">Reports in</h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">6 hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Keyframes */}
      <style jsx>{`
        @keyframes moveBall1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(-20px); }
        }
        @keyframes moveBall2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(15px) translateX(15px); }
        }
        @keyframes moveBall3 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(10px) translateX(-15px); }
        }
        .animate-moveBall1 { animation: moveBall1 8s ease-in-out infinite; }
        .animate-moveBall2 { animation: moveBall2 10s ease-in-out infinite; }
        .animate-moveBall3 { animation: moveBall3 9s ease-in-out infinite; }
      `}</style>
    </section>
  );
}

export default HeroSection;