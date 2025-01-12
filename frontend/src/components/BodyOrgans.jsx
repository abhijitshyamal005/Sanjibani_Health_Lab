import Heart from '../assets/BodyOrgans/Heart.png';
import Blood from '../assets/BodyOrgans/Blood.png';
import Bones from '../assets/BodyOrgans/Bones.png';
import Gut from '../assets/BodyOrgans/Gut+Health.webp';
import Hormons from '../assets/BodyOrgans/Hormones.png';
import Kidney from '../assets/BodyOrgans/Kidney.png';
import Repro from '../assets/BodyOrgans/Reproductive+Organs.png';
import Vitamin from '../assets/BodyOrgans/Vitamin.png';
import Liver from '../assets/BodyOrgans/Liver.png';
import { Link } from 'react-router-dom';

const Checkups = () => {
    return (
        <div className="flex justify-center items-center bg-gray-50 py-16 px-4 sm:px-6 lg:px-8 min-h-screen">
            <div className="max-w-4xl w-full flex flex-col md:flex-row items-center justify-center gap-16">
                {/* Text Section */}
                <div className="flex flex-col items-start text-left max-w-md">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-sans mb-4 text-gray-700">For Vital Body Organs</h2>
                    <p className="text-base sm:text-lg md:text-xl font-sans text-gray-700 mt-3 mb-6">
                        Explore our comprehensive range of diagnostic tests tailored for vital body organs. Our specialized diagnostic tests focus on evaluating the well-being of essential body organs, ensuring you receive the care you deserve.
                    </p>
                    <button className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base border-green-500 font-bold border-[1px] text-green-800 rounded-md">
                        View All Checkups
                    </button>
                </div>

                {/* Checkup Cards Section */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-6">
                    <Link to='/heart' className="p-4 flex flex-col items-center">
                        <img src={Heart} alt="Heart" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Heart</p>
                    </Link>
                    <Link to='/blood' className="p-4 flex flex-col items-center">
                        <img src={Blood} alt="Blood" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-100 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Blood</p>
                    </Link>
                    <Link to='/not-found' className="p-4 flex flex-col items-center">
                        <img src={Bones} alt="Bones" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Bones</p>
                    </Link>
                    <Link to='/sex-health' className="p-4 flex flex-col items-center">
                        <img src={Gut} alt="Gut Health" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Gut Health</p>
                    </Link>
                    <Link to='/not-found' className="p-4 flex flex-col items-center">
                        <img src={Hormons} alt="Hormones" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Hormones</p>
                    </Link>
                    <Link to='/kidney' className="p-4 flex flex-col items-center">
                        <img src={Kidney} alt="Kidney" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Kidney</p>
                    </Link>
                    <Link to='/not-found' className="p-4 flex flex-col items-center">
                        <img src={Repro} alt="Reproductive Organs" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Reproductive Organs</p>
                    </Link>
                    <Link to='/not-found' className="p-4 flex flex-col items-center">
                        <img src={Vitamin} alt="Vitamin" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Vitamin</p>
                    </Link>
                    <Link to='/liver' className="p-4 flex flex-col items-center">
                        <img src={Liver} alt="Liver" className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-gradient-to-l from-gray-200 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-gray-700 text-sm sm:text-base">Liver</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Checkups;
