import { useState } from 'react';
import CardComponent from '../CardComponent.jsx';

const cards = [
  { title: "Lipid Profile Test", price: "₹800", oldPrice: "₹1000", discount: "20% Off", parameters: "6", reportTime: "within 12 hours" },
  { title: "Complete Cardiac Profile", price: "₹2000", oldPrice: "₹2500", discount: "20% Off", parameters: "10", reportTime: "within 24 hours" },
  { title: "ECG (Electrocardiogram)", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 1 hour" },
  { title: "Echocardiogram (Echo)", price: "₹1500", oldPrice: "₹1800", discount: "17% Off", parameters: "1", reportTime: "within 2 hours" },
  { title: "Troponin Test", price: "₹1200", oldPrice: "₹1400", discount: "14% Off", parameters: "1", reportTime: "within 6 hours" },
  { title: "CT Angiography", price: "₹3500", oldPrice: "₹4000", discount: "12% Off", parameters: "1", reportTime: "by Tomorrow" },
];

const CarouselComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(cards.length / itemsPerPage); // Total number of pages

  const next = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="relative flex flex-col mt-12 justify-center mb-10 px-4">
      <div className='mt-12 mb-12'>
        <h2 className="text-xl text-gray-800 font-bold mb-4 text-center md:text-left">Heart Tests In Kolkata</h2>
        
        {/* Center the cards and buttons */}
        <div className="relative flex items-center">
          <button
            onClick={prev}
            className={`absolute left-0 md:left-4 top-1/2 transform -translate-y-1/2 text-black border-black border-[1px] rounded-full px-3 py-1`}
          >
            ❮
          </button>

          <div className="flex overflow-hidden max-w-5xl mx-auto">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
            >
              {cards.map((card, index) => (
                <div key={index} className="min-w-[33%] md:min-w-[23%] px-2">
                  <CardComponent
                    title={card.title}
                    price={card.price}
                    oldPrice={card.oldPrice}
                    discount={card.discount}
                    parameters={card.parameters}
                    reportTime={card.reportTime}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={next}
            className='absolute right-0 md:right-4 top-1/2 transform -translate-y-1/2 text-black border-black border-[1px] rounded-full px-3 py-1'
          >
            ❯
          </button>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4 text-xs space-x-2">
          

          {/* Dots for remaining pages */}
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-orange-500' : 'bg-gray-500'}`}></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselComponent;
