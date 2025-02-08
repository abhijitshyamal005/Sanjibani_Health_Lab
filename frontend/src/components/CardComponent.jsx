/* eslint-disable react/prop-types */
import { FaDna } from "react-icons/fa6";
import { VscRepoClone } from "react-icons/vsc";

const CardComponent = ({ title, price, oldPrice, discount, parameters, reportTime, onViewDetails, onAddToCart }) => {
    return (
        <div className="bg-white shadow-xl rounded-xl max-w-[350px] w-full mx-auto sm:mx-0 mb-5">
            {/* Header Section - Mobile redesign */}
            <div className="bg-gradient-to-r from-green-900 to-teal-700 text-white p-3 sm:p-4 rounded-t-xl sm:rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between">
                {/* Mobile: Title above price */}
                <div className="sm:hidden w-full">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="line-through text-xs mr-2">{oldPrice}</span>
                            <span className="text-xl font-bold">{price}</span>
                        </div>
                        <div className="bg-green-600 px-2 py-1 rounded-sm text-xs">{discount}</div>
                    </div>
                </div>

                {/* Desktop: Original header structure */}
                <div className="hidden sm:block font-semibold text-xl">{title}</div>
                <div className="hidden sm:block text-right">
                    <span className="line-through text-sm">{oldPrice}</span>
                    <span className="ml-2 text-xl font-bold">{price}</span>
                    <div className="ml-3 mt-1 text-center text-sm bg-green-600 rounded-sm">{discount}</div>
                </div>
            </div>

            {/* Content Section - Mobile redesign */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center text-gray-700">
                {/* Mobile: Vertical layout */}
                <div className="sm:hidden w-full space-y-4 mb-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <FaDna className="w-5 h-5 text-gray-400" />
                            <span className="font-semibold">{parameters} parameters</span>
                        </div>
                        <div className="text-gray-600 text-sm">included</div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <VscRepoClone className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-600">Report</span>
                        </div>
                        <div className="font-semibold">{reportTime}</div>
                    </div>
                </div>

                {/* Desktop: Original content structure */}
                <div className="hidden sm:flex items-start text-gray-400">
                    <FaDna className="w-6 h-6" />
                </div>
                <div className="hidden sm:block text-center sm:text-left mt-2 sm:mt-0">
                    <div className="text-gray-950 font-semibold">
                        {parameters} parameters
                        <div className="text-gray-800 font-normal">included</div>
                    </div>
                </div>
                <div className="hidden sm:flex items-start text-gray-400 mt-2 sm:mt-0">
                    <VscRepoClone className="w-6 h-6" />
                </div>
                <div className="hidden sm:block text-center sm:text-left mt-2 sm:mt-0">
                    <div className="text-gray-800 font-normal">Report</div>
                    <div className="font-semibold text-gray-800">{reportTime}</div>
                </div>
            </div>

            {/* Buttons Section - Mobile redesign */}
            <div className="p-3 sm:p-4 flex flex-col sm:flex-row gap-2">
                {/* Mobile: Full-width buttons with new style */}
                <button
                    className="sm:hidden w-full bg-gradient-to-r from-green-900 to-teal-700 text-white rounded-lg py-2.5 
                             font-semibold hover:bg-green-700 transition-colors"
                    onClick={onViewDetails}
                >
                    View Details
                </button>
                <button
                    className="sm:hidden w-full bg-gradient-to-r from-orange-500 to-orange-300 text-white rounded-lg py-2.5
                             font-semibold hover:bg-orange-600 transition-colors"
                    onClick={onAddToCart}
                >
                    Add to Cart
                </button>

                {/* Desktop: Original buttons */}
                
                <button
                    className="hidden sm:flex text-green-600 border border-green-600 rounded-md px-6 
                             font-semibold py-2 hover:bg-green-600 hover:text-white transition-colors"
                    onClick={onViewDetails}
                >
                    View Details
                </button>
                <button
                    className="hidden sm:flex bg-gradient-to-r from-[#ff970a] to-[#ffd59d] text-white 
                             rounded-md px-6 font-semibold py-2 hover:bg-orange-600 transition-colors ml-7"
                    onClick={onAddToCart}
                >
                    Add to Cart
                </button>
            </div>
        </div>
    );
}

export default CardComponent;