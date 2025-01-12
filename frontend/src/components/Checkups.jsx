import { Link } from "react-router-dom";

const Checkups = () => {
  return (
    <div className="flex justify-center items-center bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-8">
        {/* Text Section */}
        <div className="flex flex-col justify-center items-center text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-sans mb-4 text-gray-700">
            Most Booked Checkups
          </h2>
          <div className="text-sm sm:text-base md:text-lg font-sans text-gray-700 mt-2 mb-4">
            India’s fastest AI-powered & temperature-controlled supply chain to collect and test your blood in the freshest state.
          </div>
          <Link
            to='/checkup'
            className="inline-block px-4 py-2 text-xs sm:text-sm border-green-500 font-bold border text-green-800 rounded-md hover:bg-green-100 transition-colors duration-100"
          >
            View All Checkups
          </Link>
        </div>

        {/* Checkup Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-2 xl:grid-cols-2 justify-items-center gap-5">
          {/* Full Body Checkup */}
          <Link
            to='/full-body'
            className="flex flex-col justify-center items-center bg-gradient-to-t from-[#ff970a] to-[#ffd59d] p-6 h-56 w-56 rounded-xl shadow-sm relative hover:shadow-md transition-shadow duration-100"
          >
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full">
              <span className="text-xl text-orange-400">{'>'}</span>
            </div>
            <p className="text-white text-lg sm:text-xl font-semibold mt-4 mb-2">Full Body Checkup</p>
            <div className="text-white text-3xl">
              👨‍👩‍👧‍👦
            </div>
          </Link>

          {/* Sexual Health */}
          <Link
            to='/sex-health'
            className="flex flex-col justify-center items-center bg-gradient-to-r from-green-600 to-teal-100 p-6 h-56 w-56 rounded-xl shadow-sm relative hover:shadow-md transition-shadow duration-100"
          >
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full">
              <span className="text-xl text-green-400">{'>'}</span>
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Sexual Health</h3>
          </Link>

          {/* Heart Checkup */}
          <Link
            to='/heart'
            className="flex flex-col justify-center items-center bg-gradient-to-l from-green-600 to-teal-100 p-6 h-56 w-56 rounded-xl shadow-sm relative hover:shadow-md transition-shadow duration-100"
          >
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full">
              <span className="text-xl text-green-400">{'>'}</span>
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Heart Checkup</h3>
          </Link>

          {/* Fever Checkup */}
          <Link
            to='/fever'
            className="flex flex-col justify-center items-center bg-gradient-to-b from-[#ff970a] to-[#ffd59d] p-6 h-56 w-56 rounded-xl shadow-sm relative hover:shadow-md transition-shadow duration-100"
          >
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full">
              <span className="text-xl text-orange-400">{'>'}</span>
            </div>
            <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">Fever Checkup</h3>
            <div className="text-white text-3xl">🌡️</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Checkups;
