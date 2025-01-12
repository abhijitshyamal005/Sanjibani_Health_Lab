import { useState, useEffect } from "react";
import img1 from "../assets/PhotoSlider/Img1.webp";
import img2 from "../assets/PhotoSlider/Img2.webp";
import img3 from "../assets/PhotoSlider/Img3.png";
import img4 from "../assets/PhotoSlider/Img4.png";
import img5 from "../assets/PhotoSlider/Img5.webp";


const images = [
  { src: img1, link: "/" },
  { src: img2, link: "/" },
  { src: img3, link: "/" },
  { src: img4, link: "/" },
  { src: img5, link: "/" },
];

const ImageSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Go to the next image
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Go to the previous image
  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  // Automatically change slide every 3 seconds
  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 3000);
    return () => clearInterval(slideInterval); // Clear interval when component unmounts
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8 mb-8">
      {/* Image Slider Container */}
      <div className="relative overflow-hidden ">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, idx) => (
            <a href={image.link} rel="noopener noreferrer" key={idx} className="flex-shrink-0 w-full">
              <img
                src={image.src}
                alt={`Slide ${idx + 1}`}
                className="w-full h-auto object-cover rounded-md"
              />
            </a>
          ))}
        </div>



      </div>
      {/* Previous Button */}
      {/* Previous Button */}
      <button
        onClick={prevSlide}
        className="hidden sm:block absolute top-1/2 transform -translate-y-1/2 text-black border border-black px-2 py-1 rounded-full hover:bg-opacity-75 md:left-4 lg:-left-20"
      >
        &#10094;
      </button>

      {/* Next Button */}
      <button
        onClick={nextSlide}
        className="hidden sm:block absolute top-1/2 transform -translate-y-1/2 text-black border border-black px-2 py-1 rounded-full hover:bg-opacity-75 md:right-4 lg:-right-20"
      >
        &#10095;
      </button>


      {/* Dots and Current Image/Total Image Counter */}
      <div className="mt-4 flex justify-center space-x-2">
        {images.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 w-2 rounded-full ${idx === currentIndex ? 'bg-orange-500' : 'bg-gray-400'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageSlider;
