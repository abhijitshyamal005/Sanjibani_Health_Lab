import { useState, useEffect } from 'react';
import img from '../assets/we-are-orange-v2.webp';

const LastImage = () => {
  const texts = [
    'Batch Testing',
    'Collection Center',
    'Time Wasred'
  ];

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, 2000); // Change text every 2 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [texts.length]);

  return (
    <div className="flex items-center justify-center mt-8 px-4">
      <div className="relative mt-10 mb-10">
        <img
          src={img}
          alt="Image with text overlay"
          className="w-full h-auto max-w-4xl object-cover rounded-lg"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center md:ml-56 md:-mt-24 ">
          <span className="text-4xl md:text-9xl text-white  font-semibold">
            NO
          </span>
          <span className="text-2xl md:text-5xl text-white ml-16 font-bold p-4 items-end rounded-lg text-center -mt-4 md:mt-0">
            {texts[currentTextIndex]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastImage;