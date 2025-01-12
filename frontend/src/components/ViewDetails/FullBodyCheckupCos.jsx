import { FaFileAlt, FaClock, FaFlask } from 'react-icons/fa';
import img1 from '../../assets/ak-image.webp';
import CheckupCrd from './CackupList.jsx';
import { Link } from 'react-router-dom';

// Data constants
const checkupData = {
  headerTitle: 'Full Body Checkup - Comprehensive',
  testParameters: 'Tests for 107 Parameters',
  description: 'The Full Body Checkup - Comprehensive includes doctor-curated tests for the liver, kidneys, sugar, thyroid, cholesterol, blood, and urine, among others. This package helps detect potential health disorders and vitamin deficiencies. Screening for vitamin D and B12 deficiencies is vital for overall health. Deficiencies can cause weak bones, fatigue, numbness, mood swings, and impaired immunity. Regular checkups help maintain optimal health, ensuring recommended levels of both vitamins.',
  availability: 'Available every day from 6:30 AM to 10 PM',
  samples: [
    { type: '🩸 Blood', color: 'text-red-600' },
    { type: '🧪 Urine', color: 'text-yellow-600' }
  ],
  preparation: 'No Fasting Required',
  features: [
    { icon: <FaFlask className="w-6 h-6 text-[#ff970a]" />, title: 'In-house labs', subtitle: 'NABL certified' },
    { icon: <FaClock className="w-6 h-6 text-[#ff970a]" />, title: '60 mins collection', subtitle: '6 AM - 10 PM' },
    { icon: <FaFileAlt className="w-6 h-6 text-[#ff970a]" />, title: 'Reports by', subtitle: 'Today' }
  ],
  priceDetails: {
    discountOffer: 'Get 15% OFF* On 1st order above ₹500. Use: ORANGE15',
    price: '₹3599',
    originalPrice: '₹13663',
    discount: '74% Off',
    cartButton: 'Add to Cart'
  },
  extraInfo: [
    { icon: '🏠', text: 'Free home sample collection in 60 mins' },
    { icon: '📄', text: 'Reports within 7 hours' }
  ],
  link: '/full-body-comprehensive'
};

// FullBodyCheckupCard Component
const FullBodyCheckupCard = () => {
  const { headerTitle, testParameters, description, availability, samples, preparation, features, priceDetails, extraInfo } = checkupData;

  return (
    <>
      <div className="container mx-auto mt-8 px-4">
        <div className="flex flex-col lg:flex-row bg-gray-100 p-6 rounded-lg shadow-lg">
          {/* Left Section */}
          <div className="flex-1 lg:w-3/4 pr-4">
            {/* Header Background */}
            <div className="bg-gradient-to-t from-[#f3ab46] to-[#ffb347] w-full h-28 rounded-xl relative"></div>
            {/* Card Content */}
            <div className="bg-white p-6 rounded-xl shadow-lg mt-[-3rem] lg:mt-[-5rem] relative">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{headerTitle}</h2>
              <div className="flex flex-col lg:flex-row items-center lg:items-start">
                <div className="lg:w-2/3">
                  <p className="text-white font-bold bg-[#01b279] px-4 py-2 inline-block rounded-br-2xl">{testParameters}</p>
                  <p className="mt-4 text-gray-700">{description}</p>
                </div>
                <img src={img1} alt="Man holding phone" className="w-full lg:w-1/3 rounded-full mt-4 lg:mt-0" />
              </div>
              <div className="mt-5 text-gray-700 text-center lg:text-left">{availability}</div>
            </div>

            {/* Samples & Preparation */}
            <div className="flex flex-col lg:flex-row justify-between bg-white p-6 rounded-b-lg shadow-md mt-6">
              <div>
                <h3 className="text-lg font-semibold">Sample(s) required</h3>
                <div className="flex flex-wrap mt-2">
                  {samples.map((sample, index) => (
                    <span key={index} className={`${sample.color} font-bold mr-4 mb-2`}>
                      {sample.type}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Preparation required</h3>
                <p className="mt-2 text-green-600 font-bold">{preparation}</p>
              </div>
            </div>

            {/* Features */}
            <div className="flex flex-col lg:flex-row justify-center gap-6 mt-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center bg-white rounded-lg shadow-md p-4 w-full lg:w-1/3">
                  <div className="w-12 h-12 bg-orange-100 flex items-center justify-center rounded-lg">
                    {feature.icon}
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-700 font-medium">{feature.title}</div>
                    <div className="text-gray-500 text-sm">{feature.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="lg:w-1/3 mt-5 lg:mt-0">
            {/* Pricing and Actions */}
            <div className="bg-gradient-to-t from-orange-100 to-orange-50 p-4 border-2 border-white rounded-lg">
              <div className="bg-[#01b279] text-white p-2 rounded-t-md">
                <p className="text-sm">{priceDetails.discountOffer}</p>
              </div>
              <div className="mt-4 flex justify-between items-center p-3">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {priceDetails.price} <span className="line-through text-gray-500">{priceDetails.originalPrice}</span>
                  </h3>
                  <p className="bg-[#01b279] text-white rounded-br-lg p-1 w-24 text-center font-bold text-sm mt-1">
                    {priceDetails.discount}
                  </p>
                </div>
                <div>
                  <Link 
                    to={checkupData.link} 
                    className="bg-gradient-to-t from-[#f3ab46] to-[#ffb347] font-bold text-white px-6 py-2 text-lg rounded-lg"
                  >
                    {priceDetails.cartButton}
                  </Link>
                </div>
              </div>
            </div>

            {/* Extra Information */}
            <div className="mt-4 bg-white p-4 rounded-lg shadow-md">
              {extraInfo.map((info, index) => (
                <div key={index} className="flex items-center mt-4">
                  <span className="text-green-600 mr-2">{info.icon}</span>
                  <p className="text-gray-700">{info.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CheckupCrd />
    </>
  );
};

export default FullBodyCheckupCard;
