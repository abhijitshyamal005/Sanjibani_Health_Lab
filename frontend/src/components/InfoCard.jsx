import { FaUserDoctor } from "react-icons/fa6";
import lab1 from '../assets/lab-testing.webp';
import order from '../assets/3-steps.webp';
import ndImg from '../assets/man-holding-umbrella.webp';

const InfoCard = () => {
    return (
        <div className="flex justify-center items-center bg-gradient-to-t from-gray-100 to-gray-50 p-4">
            <div className="flex flex-col md:flex-row max-w-4xl w-full mx-auto bg-white rounded-xl mt-10 mb-12">
                {/* Left Section (Why SanjiBani) */}
                <div className="bg-gradient-to-b from-green-900 to-teal-500 text-white rounded-xl p-4 flex flex-col justify-between md:w-1/2">
                    <h2 className="text-3xl md:text-5xl font-semibold text-orange-300 ml-6 mt-5 mb-4">Why SanjiBani?</h2>          
                    <p className="text-xl md:text-2xl font-semibold ml-6 max-w-xs md:max-w-md mb-2">Hygienic and Professional eMedics</p>
                    <div className='flex items-center ml-6 mb-2'>
                        <FaUserDoctor className='w-6 h-6 md:w-8 md:h-8 bg-gradient-to-t from-[#ff970a] to-[#ffd59d] rounded-lg text-white p-1' />
                        <div className="text-xs md:text-sm font-bold text-white ml-2">100+ hours of training</div>
                    </div>
                    <img src={lab1} alt="lab" className="w-full mb-2 rounded-lg" />
                    <p className="text-center font-semibold text-xs md:text-sm mb-2">Well-groomed eMedics who are trained for 100+ hours for a painless single prick experience</p>
                    <div className="flex justify-between w-full">
                        <button className="text-white text-lg md:text-xl">&larr;</button>
                        <button className="text-white text-lg md:text-xl">&rarr;</button>
                    </div>
                </div>

                {/* Right Section (Middle + Right Cards) */}
                <div className="w-full md:w-1/2 flex flex-col gap-2 p-4 bg-gray-100">
                    <img src={order} alt="3-steps" className="w-full h-auto rounded-lg bg-gray-100 shadow-sm" />
                    <img src={ndImg} alt="" className="w-full h-auto rounded-lg bg-gray-100" />
                </div>
            </div>
        </div>
    );
};

export default InfoCard;
