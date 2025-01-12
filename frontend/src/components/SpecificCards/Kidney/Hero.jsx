/* eslint-disable react/no-unescaped-entities */
import { FaFlask, FaClock, FaFileAlt } from 'react-icons/fa'; // React Icons for replacement
import heroImg from '../../../assets/ak-image.webp';
import { Link } from 'react-router-dom';

function HeroSection() {
    return (
        <>
            {/* Breadcrumb */}
            <div className='flex items-center justify-start ml-10 mt-3 text-sm'>
                <Link to='/' className='font-semibold text-gray-500 text-xs'>Home {'>'}</Link>
                <span className='ml-4 font-semibold text-gray-600'>Kidney Checkups</span>
            </div>

            {/* Hero Section */}
            <div className="flex flex-col justify-center items-center mt-10">
                <div className="flex flex-col lg:flex-row justify-between items-center w-3/4 max-w-5xl bg-gradient-to-r from-white to-gray-200 rounded-3xl shadow-lg p-8">
                    {/* Text Section */}
                    <div className="w-full lg:w-2/3 mb-6 lg:mb-0 lg:pl-24 pr-5">
                        <h2 className="text-3xl font-bold text-gray-600 mb-4">Kidney Checkups</h2>
                        <p className="text-gray-700 mt-3 text-sm font-semibold leading-relaxed">
                            Book a lab test online and get tested at home in 60 mins with SanjiBani Health Labs - NABL accredited and ICMR approved diagnostic lab.
                        </p>
                    </div>

                    {/* Image Section */}
                    <div className="w-full lg:w-1/3">
                        <img
                            src={heroImg}
                            alt="Illustration of kidney checkups"
                            className="w-full h-auto object-contain rounded-lg"
                        />
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="flex flex-col lg:flex-row justify-center gap-6 mt-12">
                {/* In-house labs */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-6 w-64 mb-4 lg:mb-0">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFlask className="w-6 h-6 text-[#ff970a]" aria-label="In-house labs" />
                    </div>
                    <div className='ml-4'>
                        <div className="text-gray-700 font-medium">In-house labs</div>
                        <div className="text-gray-500 text-sm">NABL certified</div>
                    </div>
                </div>

                {/* 60 mins collection */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-6 w-64 mb-4 lg:mb-0">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaClock className="w-6 h-6 text-[#ff970a]" aria-label="60 mins collection" />
                    </div>
                    <div className='ml-4'>
                        <div className="text-gray-700 font-medium">60 mins collection</div>
                        <div className="text-gray-500 text-sm">6 AM - 10 PM</div>
                    </div>
                </div>

                {/* Reports in 6 hours */}
                <div className="flex items-center justify-center rounded-lg bg-white shadow-md p-6 w-64">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                        <FaFileAlt className="w-6 h-6 text-[#ff970a]" aria-label="Reports in 6 hours" />
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
