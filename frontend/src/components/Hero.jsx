import { FaBox, FaMicroscope } from 'react-icons/fa6';
import { LuSearch } from "react-icons/lu";
import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa'; // React Icons for replacement
import heroImg from '../assets/hero4.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
  return (
    <>
      <div className="relative flex justify-center mt-5">
        <img
          src={heroImg}
          alt="hero img"
          className="w-full max-w-[1100px] object-contain relative z-10"
        />

        {/* Animated Blurred Balls */}
        <div className="absolute top-8 left-1/4 w-20 h-20 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall1 z-20"></div>
        <div className="absolute top-9 left-2/3 w-12 h-12 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall2 z-20"></div>
        <div className="absolute bottom-7 right-1/4 w-24 h-24 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall3 z-20"></div>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-lg py-6 px-4 sm:px-8 rounded-[15px] shadow-md w-full max-w-4xl mx-auto mt-[-5%] relative z-30">
        {/* Section with 2/3 width of the image */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
          <div className="relative w-full lg:w-1/2">
            <input
              type="text"
              placeholder="Search for tests"
              className="w-full px-3 py-2 pr-10 text-base rounded-[10px] border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 sm:px-4 sm:py-3 sm:text-lg md:max-w-md mx-auto"
            />
            <LuSearch className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 sm:h-6 sm:w-6 md:right-3 md:h-7 md:w-7" />
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <Link to='/labtest' className="flex items-center space-x-2 text-white bg-gradient-to-r from-orange-500 to-orange-300 hover:from-orange-500 hover:to-orange-300 transition-all duration-300 rounded-lg py-2 px-4 sm:py-3 sm:px-7 text-sm sm:text-lg">
              <span className="font-medium">Lab Tests</span>
              <FaMicroscope className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>

            <Link to='/checkup' className="flex items-center space-x-2 text-white bg-gradient-to-r from-green-700 to-green-400 hover:from-green-700 hover:to-green-400 transition-all duration-300 rounded-lg py-2 px-4 sm:py-3 sm:px-7 text-sm sm:text-lg">
              <span className="font-medium">Checkups</span>
              <FaBox className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-gray-600 text-sm sm:text-base">
        Get <span className='text-orange-500 font-medium'>15% OFF*</span> on orders above <span className='font-semibold'>₹500</span> | Use: <span className='font-semibold'>RXTU4569</span>
      </div>

      {/* Additional Section below the offer with margin */}
      <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-8 mt-10 px-4">
        {/* In-house labs */}
        <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <FaFlask className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
          </div>
          <div className='ml-4 sm:ml-6'>
            <div className="text-gray-700 font-medium">In-house labs</div>
            <div className="text-gray-500 text-xs sm:text-sm">NABL certified</div>
          </div>
        </div>

        {/* 60 mins collection */}
        <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
          </div>
          <div className='ml-4 sm:ml-6'>
            <div className="text-gray-700 font-medium">60 mins collection</div>
            <div className="text-gray-500 text-xs sm:text-sm">6 AM - 10 PM</div>
          </div>
        </div>

        {/* Reports in 6 hours */}
        <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <FaFileAlt className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
          </div>
          <div className='ml-4 sm:ml-6'>
            <div className="text-gray-700 font-medium">Reports in</div>
            <div className="text-gray-500 text-xs sm:text-sm">6 hours</div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HeroSection;
