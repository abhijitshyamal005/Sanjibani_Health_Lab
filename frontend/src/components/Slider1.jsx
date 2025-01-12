import { useState, useEffect } from 'react';
import CardComponent from './CardComponent';
import { FaBookReader } from "react-icons/fa"; // Assuming the card component is in the same folder
import { useNavigate } from 'react-router-dom'; // For navigation

const Slider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate(); // Initialize navigate for routing

    const slides = [
        {
            title: "Full Body Checkup - Essential",
            price: "₹1599",
            oldPrice: "₹6063",
            discount: "74% Off",
            parameters: "91",
            reportTime: "within 7 hours",
            textTitle: "Basic Health Screening",
            description: "An essential health checkup that covers all the basic parameters to keep track of your body functions.",
            link: "/full-body-es" // Added link
        },
        {
            title: "Full Body Checkup - Comprehensive",
            price: "₹3599",
            oldPrice: "₹13663",
            discount: "74% Off",
            parameters: "107",
            reportTime: "by Today",
            textTitle: "Comprehensive Wellness Package",
            description: "Get a deep insight into your health with an advanced set of parameters. Ideal for a thorough health assessment.",
            link: "/full-body-cos" // Added link
        },
        {
            title: "Full Body Checkup - Advanced",
            price: "₹5999",
            oldPrice: "₹16000",
            discount: "70% Off",
            parameters: "120",
            reportTime: "by Tomorrow",
            textTitle: "Advanced Medical Checkup",
            description: "A perfect package for those who want a detailed analysis of their health with a quick turnaround for reports.",
            link: "/full-body-es" // Added link
        },
        {
            title: "Full Body Checkup - Premium",
            price: "₹7999",
            oldPrice: "₹18000",
            discount: "65% Off",
            parameters: "150",
            reportTime: "within 24 hours",
            textTitle: "Premium Health Plan",
            description: "An all-inclusive health checkup plan covering extensive tests to monitor every aspect of your body.",
            link: "/full-body-cos" // Added link
        },
        {
            title: "Full Body Checkup - Platinum",
            price: "₹10999",
            oldPrice: "₹22000",
            discount: "50% Off",
            parameters: "200",
            reportTime: "within 2 days",
            textTitle: "Platinum Health Screening",
            description: "The ultimate health checkup covering every possible parameter. Ideal for executive health monitoring.",
            link: "/full-body-es" // Added link
        },
        {
            title: "Full Body Checkup - Executive",
            price: "₹12999",
            oldPrice: "₹24000",
            discount: "45% Off",
            parameters: "250",
            reportTime: "within 1 day",
            textTitle: "Executive Health Package",
            description: "Tailored for professionals who need to stay at the top of their health with detailed and fast report generation.",
            link: "/full-body-cos" // Added link
        },
    ];

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
        }, 3000); // Auto-slide every 3 seconds

        return () => clearInterval(slideInterval); // Clean up on component unmount
    }, [slides.length]);

    const handleViewDetails = (link) => {
        navigate(link); // Navigate to the link
    };

    return (
        <div className="relative flex flex-col items-center mt-8 mb-8 px-4">
            <div className="relative w-full max-w-screen-lg">
                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-1000"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {slides.map((slide, index) => (
                            <div key={index} className="min-w-full flex flex-col md:flex-row justify-center items-center space-y-6 md:space-y-0 md:space-x-8">
                                {/* Card section */}
                                <CardComponent
                                    title={slide.title}
                                    price={slide.price}
                                    oldPrice={slide.oldPrice}
                                    discount={slide.discount}
                                    parameters={slide.parameters}
                                    reportTime={slide.reportTime}
                                    onViewDetails={() => handleViewDetails(slide.link)} // Pass the link to handleViewDetails
                                />
                                {/* Text section */}
                                <div className="text-left max-w-sm mx-4">
                                    <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                                        {slide.textTitle}
                                    </h2>
                                    <p className="text-base text-gray-600 mt-4 md:text-lg">
                                        {slide.description}
                                    </p>
                                    <div className='flex mt-6 items-center'>
                                        <FaBookReader className='w-8 h-8 md:w-10 md:h-10 bg-gradient-to-t from-[#ff970a] to-[#ffd59d] rounded-lg text-white p-2' />
                                        <p className="text-xs md:text-sm text-gray-500 ml-3 md:ml-5">
                                            Trusted by <strong>1M+ customers</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Navigation Arrows */}
                <button
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full text-lg md:text-xl"
                    onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
                >
                    &#10094;
                </button>
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full text-lg md:text-xl"
                    onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
                >
                    &#10095;
                </button>
                {/* Dots Indicator */}
                <div className="flex justify-center mt-4">
                    {slides.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 w-2 mx-1 rounded-full ${index === currentSlide ? 'bg-gray-800' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Slider;
