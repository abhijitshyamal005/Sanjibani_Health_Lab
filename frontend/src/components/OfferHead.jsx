import { Link } from "react-router-dom";

const OfferHead = () => {
  return (
    <div className="bg-[#244c44] w-full h-auto flex flex-col md:flex-row items-center p-4 md:p-5 justify-center space-y-2 md:space-y-0 md:space-x-4">
      {/* Container for text */}
      <Link className="text-white text-base md:text-lg text-center md:text-left">
        Get an <span className="font-semibold underline">Rapid Dengue Testing</span> with Accurate Reports in 6 hours @{" "}
        <span className="font-semibold underline">₹750/-</span>
      </Link>

      {/* Button */}
      <Link
        to='/checkup'
        className="bg-gradient-to-r from-[#ff970a] to-[#ffac3b] text-white hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-lg px-4 py-2 md:px-5 md:py-2 text-center"
      >
        <span className="text-sm md:text-base font-medium">BOOK NOW</span>
      </Link>
    </div>
  );
};

export default OfferHead;
