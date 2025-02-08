import { LuSearch } from "react-icons/lu";
import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa'; // React Icons for replacement
import heroImg from '../../assets/LabTest/hero-image.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
    return (
        <>
            <div className='flex items-center ml-4 md:ml-8 lg:ml-52 mt-3 text-xs md:text-sm'>
                <Link to='/' className='font-semibold text-gray-500'>Home {'>'}</Link>
                <span className='ml-4 font-semibold text-gray-600'>Lab Test Kolkata</span>
            </div>

            <div className="relative flex flex-col items-center mt-3">
                <img
                    src={heroImg}
                    alt="hero img"
                    className="w-full max-w-[1100px] object-contain relative z-10"
                />

                {/* Text Section on the left side of the image */}
                <div className="absolute top-1/4 left-1/3 md:-mt-9 transform -translate-x-1/2 max-w-xl p-4 px-6 lg:px-10 z-20">
                    <h2 className="text-xl md:text-3xl lg:text-4xl md:mt-0 -mt-10 font-bold text-gray-600 mb-4">Blood Test at Home in Kolkata</h2>
                    <p className="text-gray-700 mt-4 text-sm md:text-base font-semibold leading-relaxed hidden md:block">
                        With SanjiBani Health Labs, book a blood or urine lab test at home & get the fastest blood sample collection from a NABL & ICMR Certified lab near you in Mumbai.
                    </p>
                    <p className="text-gray-700 text-sm md:text-base font-semibold leading-relaxed mt-4 hidden md:block">
                        Enjoy the comfort of a high-quality diagnostic lab from the comfort of your home.
                    </p>
                </div>

                {/* Animated Blurred Balls */}
                <div className="absolute top-8 left-1/4 w-20 h-20 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall1 z-20"></div>
                <div className="absolute top-9 left-2/3 w-12 h-12 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall2 z-20"></div>
                <div className="absolute bottom-7 right-1/4 w-24 h-24 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall3 z-20"></div>
            </div>

            <div className="bg-white bg-opacity-35 backdrop-blur-lg py-6 px-4 rounded-[25px] shadow-md w-full max-w-lg mx-auto -mt-14 relative z-30">
                {/* Background matching the width of the search component */}
                <div className="flex items-center justify-start">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search for tests"
                            className="w-full px-4 py-3 pr-12 text-lg rounded-[15px] border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                        <LuSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-7 w-7" />
                    </div>
                </div>
            </div>

            <div className="text-center mt-6 md:mt-8 px-4">
                <p className="text-sm md:text-base text-gray-600">
                    Get <span className="text-orange-500 font-semibold">15% OFF*</span> on orders above ₹500 | 
                    Use code: <span className="font-semibold text-gray-700">RXTU4569</span>
                </p>
            </div>

            {/* Features Grid - Improved mobile layout */}
            <div className="grid md:grid-cols-3 gap-4 md:gap-6 mt-8 md:mt-12 px-4 max-w-6xl mx-auto">
                <div className="flex items-start p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <FaFlask className="text-orange-500 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">NABL Certified Labs</h3>
                        <p className="text-sm text-gray-500">Accurate & Reliable Testing</p>
                    </div>
                </div>

                <div className="flex items-start p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <FaClock className="text-orange-500 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Quick Sample Collection</h3>
                        <p className="text-sm text-gray-500">6 AM - 10 PM Daily</p>
                    </div>
                </div>

                <div className="flex items-start p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <FaFileAlt className="text-orange-500 text-xl" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Fast Digital Reports</h3>
                        <p className="text-sm text-gray-500">Within 6 Hours</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HeroSection;
