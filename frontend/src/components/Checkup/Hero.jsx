/* eslint-disable react/no-unescaped-entities */
import { LuSearch } from "react-icons/lu";
import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa'; // React Icons for replacement
import heroImg from '../../assets/LabTest/hero-image.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
    return (
        <>
            {/* Breadcrumb */}
            <div className='flex items-center ml-4 mt-3 text-sm md:ml-10 lg:ml-52'>
                <Link to='/' className='font-semibold text-gray-500 text-xs md:text-sm'>Home {'>'}</Link>
                <span className='ml-2 font-semibold text-gray-600 text-xs md:text-sm'>Health Checkups Kolkata</span>
            </div>
            
            {/* Hero Section */}
            <div className="relative flex flex-col md:flex-row justify-center mt-6 md:mt-10">
                <img
                    src={heroImg}
                    alt="hero img"
                    className="w-full md:w-3/4 lg:max-w-[1100px] object-contain relative z-10"
                />

                {/* Text Section on the left side of the image */}
                <div className="absolute w-full md:w-1/2 lg:max-w-xl left-0 -mt-16 md:mt-10 md:-ml-11 md:left-1/4 p-4 px-6 md:px-10 z-20">
                    <h2 className="text-xl md:text-3xl font-bold text-gray-600 mb-4">Full Body Checkups in Kolkata.</h2>
                    <p className="text-gray-700 text-sm md:text-base font-semibold leading-relaxed mt-3 hidden md:block">
                        In today's fast-paced world, it's essential to prioritize your health and not let it take a back seat. Experience hassle-free testing by booking our comprehensive full body checkup near you in Kolkata.
                    </p>
                    <p className="text-gray-700 text-sm md:text-base font-semibold leading-relaxed mt-4 hidden md:block">
                        Leave all your health worries to us and ensure a thorough examination of your entire body in the comfort of your own home!
                    </p>
                </div>

                {/* Animated Blurred Balls */}
                <div className="absolute top-8 left-1/4 w-20 h-20 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall1 z-20 hidden md:block"></div>
                <div className="absolute top-9 left-2/3 w-12 h-12 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall2 z-20 hidden md:block"></div>
                <div className="absolute bottom-7 right-1/4 w-24 h-24 bg-[#ffb222] rounded-full blur-[20px] opacity-70 animate-moveBall3 z-20 hidden md:block"></div>
            </div>

            {/* Search Section */}
            <div className="bg-white bg-opacity-35 backdrop-blur-lg py-6 px-4 rounded-lg shadow-md w-full max-w-lg mx-auto -mt-14 relative z-30">
                <div className="flex items-center">
                    <div className="relative w-full">
                        <input
                            type="text"
                            placeholder="Search for tests"
                            className="w-full px-4 py-3 pr-12 text-lg rounded-lg border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300"
                        />
                        <LuSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-7 w-7" />
                    </div>
                </div>
            </div>

            {/* Offer Section */}
            <div className="mt-4 text-center text-gray-600 text-sm md:text-base">
                Get <span className='text-orange-500 font-medium'>15% OFF*</span> on orders above <span className='font-semibold'>₹500</span> | Use: <span className='font-semibold'>RXTU4569</span>
            </div>

            {/* Features Section */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 md:mt-10">
                {/* In-house labs */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 w-full md:w-64">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFlask className="w-6 h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-4'>
                        <div className="text-gray-700 font-medium">In-house labs</div>
                        <div className="text-gray-500 text-sm">NABL certified</div>
                    </div>
                </div>

                {/* 60 mins collection */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 w-full md:w-64">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaClock className="w-6 h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-4'>
                        <div className="text-gray-700 font-medium">60 mins collection</div>
                        <div className="text-gray-500 text-sm">6 AM - 10 PM</div>
                    </div>
                </div>

                {/* Reports in 6 hours */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 w-full md:w-64">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFileAlt className="w-6 h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-4'>
                        <div className="text-gray-700 font-medium">Reports in</div>
                        <div className="text-gray-500 text-sm">6 hours</div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HeroSection;
