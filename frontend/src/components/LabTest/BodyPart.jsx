import Heart from '../../assets/BodyOrgans/Heart.png';
import Blood from '../../assets/BodyOrgans/Blood.png';
import Bones from '../../assets/BodyOrgans/Bones.png';
import Hormons from '../../assets/BodyOrgans/Hormones.png';
import Kidney from '../../assets/BodyOrgans/Kidney.png';
import Repro from '../../assets/BodyOrgans/Reproductive+Organs.png';

import { Link } from 'react-router-dom';

const Checkups = () => {
    return (
        <div className="flex flex-col items-center mb-12 px-4">
            <div className="max-w-4xl w-full grid grid-cols-1 mt-10 md:grid-cols-2 gap-8">
                {/* Text Section */}
                <div className="flex flex-col justify-center text-center md:text-left">
                    <h2 className="text-3xl md:text-5xl font-bold font-sans mb-4 text-gray-700">For Vital Body Organs</h2>
                    <div className="text-base md:text-lg font-sans text-gray-700 mt-3 mb-8">
                        Explore our comprehensive range of diagnostic tests tailored for vital body organs. Our specialized diagnostic tests focus on evaluating the well-being of essential body organs, ensuring you receive the care you deserve.
                    </div>
                </div>

                {/* Checkup Cards Section */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <Link to='/heart' className="p-4 flex flex-col items-center">
                        <img src={Heart} alt="Heart" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-200 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Heart</p>
                    </Link>
                    <Link to='/not-found' className="p-4 flex flex-col items-center">
                        <img src={Blood} alt="Blood" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-100 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Blood</p>
                    </Link>
                    <Link to='' className="p-4 flex flex-col items-center">
                        <img src={Bones} alt="Bones" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-200 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Bones</p>
                    </Link>
                    <Link to='' className="p-4 flex flex-col items-center">
                        <img src={Hormons} alt="Hormones" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-200 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Hormones</p>
                    </Link>
                    <Link to='/kidney' className="p-4 flex flex-col items-center">
                        <img src={Kidney} alt="Kidney" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-200 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Kidney</p>
                    </Link>
                    <Link to='' className="p-4 flex flex-col items-center">
                        <img src={Repro} alt="Reproductive Organs" className="w-16 h-16 md:w-18 md:h-18 mb-3 bg-gradient-to-l from-gray-200 p-1 to-gray-50 shadow-md rounded-xl" />
                        <p className="text-center text-gray-700 text-sm md:text-base">Reproductive Organs</p>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Checkups;
