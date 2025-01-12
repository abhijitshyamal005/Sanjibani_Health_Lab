import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa'; // React Icons for replacement
import heroImg from '../../../assets/ak-image.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
    return (
        <>
            {/* Breadcrumb */}
            <div className='flex items-center justify-start ml-4 sm:ml-10 mt-3 text-xs sm:text-sm'>
                <Link to='/' className='font-semibold text-gray-500'>Home {'>'}</Link>
                <span className='ml-2 sm:ml-4 font-semibold text-gray-600'>Full Body Checkups</span>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col items-center mt-8 sm:mt-10">
                <div className="flex flex-col sm:flex-row justify-center items-center w-full max-w-5xl bg-gradient-to-r from-white to-gray-200 rounded-3xl shadow-lg p-4 sm:p-6">
                    {/* Text Section */}
                    <div className="w-full sm:w-2/3 mb-6 sm:mb-0 sm:pr-5">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-600 mb-4">Full Body Checkups</h2>
                        <p className="text-gray-700 mt-3 text-sm font-semibold leading-relaxed">
                            Book a lab test online and get tested at home in 60 mins with SanjiBani Health Labs- NABL accredited and ICMR approved diagnostic lab.
                        </p>
                    </div>

                    {/* Image Section */}
                    <div className="w-full sm:w-1/3">
                        <img
                            src={heroImg}
                            alt="hero img"
                            className="w-full h-auto object-contain rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 sm:mt-12">
                {/* In-house labs */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-64">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFlask className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-2 sm:ml-4'>
                        <div className="text-gray-700 font-medium">In-house labs</div>
                        <div className="text-gray-500 text-xs sm:text-sm">NABL certified</div>
                    </div>
                </div>

                {/* 60 mins collection */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-64">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-2 sm:ml-4'>
                        <div className="text-gray-700 font-medium">60 mins collection</div>
                        <div className="text-gray-500 text-xs sm:text-sm">6 AM - 10 PM</div>
                    </div>
                </div>

                {/* Reports in 6 hours */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-4 sm:p-6 w-full sm:w-64">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFileAlt className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff970a]" />
                    </div>
                    <div className='ml-2 sm:ml-4'>
                        <div className="text-gray-700 font-medium">Reports in</div>
                        <div className="text-gray-500 text-xs sm:text-sm">6 hours</div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default HeroSection;
