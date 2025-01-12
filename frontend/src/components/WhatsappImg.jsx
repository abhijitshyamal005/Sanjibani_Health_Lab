import img1 from '../assets/WhatsappImg/whatsapp-support.webp';

const ImageSlider = () => {
  return (
    <div className="flex flex-col items-center bg-gray-100 justify-center">
      <div className="mt-12 mb-12 w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Image Slider Container */}
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-500 ease-in-out">
            <a 
              href="https://wa.me/6296390743" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="min-w-full"
            >
              <img
                src={img1}
                alt="whatsapp"
                className="w-full h-auto object-cover rounded-md"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
