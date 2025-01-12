/* eslint-disable react/no-unescaped-entities */
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-5">
      {/* Branding Section */}
      <div className="mt-16 mb-12 sm:mt-24 sm:mb-20">
        <div className="flex flex-col items-center mb-8">
          <div className="text-orange-400 text-3xl font-bold">SanjiBani</div>
          <div className="text-green-600 text-2xl mt-[-7px]">
            Health
            <span className="text-orange-400 font-semibold">Labs</span>
          </div>
        </div>

        {/* 404 Message */}
        <h1 className="text-4xl sm:text-6xl font-bold text-green-600 mb-4">404</h1>
        <h2 className="text-xl sm:text-2xl font-semibold text-orange-500 mb-6">
          Oops! Page Not Found
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Link to go back home */}
        <Link 
          to="/" 
          className="bg-gradient-to-r from-orange-500 to-orange-300 text-white py-3 px-6 rounded-xl font-semibold hover:bg-orange-600 transition"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
