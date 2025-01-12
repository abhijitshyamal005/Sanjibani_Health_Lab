/* eslint-disable react/prop-types */
// CardComponent.jsx
import { FaDna } from "react-icons/fa6";
import { VscRepoClone } from "react-icons/vsc";

const CardComponent = ({ title, price, oldPrice, discount, parameters, reportTime, onViewDetails, onAddToCart }) => {
    return (
        <div className="bg-white shadow-xl rounded-xl p-3 max-w-sm w-full ml-5 mb-5 sm:ml-0">
            <div className="bg-gradient-to-r from-green-800 to-teal-700 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between">
                <div className="font-semibold text-lg sm:text-xl">{title}</div>
                <div className="text-right mt-2 sm:mt-0">
                    <span className="line-through text-sm">{oldPrice}</span>
                    <span className="ml-2 text-lg font-bold">{price}</span>
                    <div className="ml-3 mt-1 text-center text-sm bg-green-600 rounded-sm">{discount}</div>
                </div>
            </div>
            <div className="p-4 flex flex-col sm:flex-row justify-between items-center text-gray-700">
                <div className="flex items-start text-gray-400">
                    <FaDna className="w-6 h-6" />
                </div>
                <div className="text-center sm:text-left mt-2 sm:mt-0">
                    <div className="text-gray-950 font-semibold">
                        {parameters} parameters
                        <div className="text-gray-800 font-normal">included</div>
                    </div>
                </div>
                <div className="flex items-start text-gray-400 mt-2 sm:mt-0">
                    <VscRepoClone className="w-6 h-6" />
                </div>
                <div className="text-center sm:text-left mt-2 sm:mt-0">
                    <div className="text-gray-800 font-normal">Report</div>
                    <div className="font-semibold text-gray-800">{reportTime}</div>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-around items-center mt-1">
                <button
                    className="text-green-600 border border-green-600 rounded-md px-6 font-semibold py-2 mb-2 sm:mb-0 sm:mr-2 hover:bg-green-600 hover:text-white"
                    onClick={onViewDetails}
                >
                    View Details
                </button>
                <button
                    className="bg-gradient-to-r from-[#ff970a] to-[#ffd59d] text-white rounded-md px-6 font-semibold py-2 hover:bg-orange-600"
                    onClick={onAddToCart}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

export default CardComponent;
