import { useState } from 'react';
import CardComponent from '../CardComponent.jsx';
import { toast } from 'react-toastify';
import { addToCart } from '../../utils/cartUtils.js';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { v4 as uuidv4 } from 'uuid';

const cards = [
  { id: uuidv4(), title: "Typhoid Fever Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "within 6 hours" },
  { id: uuidv4(), title: "Dengue Fever Test", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "2", reportTime: "within 24 hours" },
  { id: uuidv4(), title: "Malaria Test", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 12 hours" },
  { id: uuidv4(), title: "Chikungunya Test", price: "₹550", oldPrice: "₹650", discount: "15% Off", parameters: "1", reportTime: "by Tomorrow" },
  { id: uuidv4(), title: "Viral Fever Profile", price: "₹600", oldPrice: "₹750", discount: "20% Off", parameters: "5", reportTime: "within 2 days" },
  { id: uuidv4(), title: "Influenza (Flu) Test", price: "₹800", oldPrice: "₹950", discount: "16% Off", parameters: "3", reportTime: "by Today" },
];

const CarouselComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalPages = Math.ceil(cards.length / 3); 
  const Navigate = useNavigate();
  const { refreshCart } = useCart();

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
   const handleAddToCart = async (product) => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Please login first!");
        Navigate('/login');
        return;
      }
  
      if (!product || !product.id) {
        toast.error("Invalid product or product ID.");
        return;
      }
  
      try {
        await addToCart(product.id, 1, { title: product.title, price: product.price }, token);
        refreshCart();
        toast.success(`Added "${product.title}" to cart!`);
        // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Failed to add to cart.");
      }
    };

  return (
    <div className="relative flex flex-col mt-12 md:mt-26 mb-10 px-4">
      <div className="mb-16">
        <h2 className="text-2xl  ml-10 text-gray-800 font-bold mb-4 text-center md:text-left">Dengue and Fever Tests In Kolkata</h2>
        
        {/* Center the cards and buttons */}
        <div className="relative flex items-center justify-center">
          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 text-black border-black border-[1px] rounded-full px-3 py-1 md:px-4 md:py-2 text-xs md:text-base"
          >
            ❮
          </button>

          <div className="flex overflow-hidden max-w-full md:max-w-5xl space-x-4">
            <div
              className="flex transition-transform duration-300 ease-in-out md:gap-3"
              style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
            >
              {cards.map((card, index) => (
                <div key={index} className="min-w-[66%] md:min-w-[27%] flex-shrink-0">
                  <CardComponent
                    title={card.title}
                    price={card.price}
                    oldPrice={card.oldPrice}
                    discount={card.discount}
                    parameters={card.parameters}
                    reportTime={card.reportTime}
                    onAddToCart={() => handleAddToCart(card)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 text-black border-black border-[1px] rounded-full px-3 py-1 md:px-4 md:py-2 text-xs md:text-base"
          >
            ❯
          </button>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-4 text-xs md:text-base space-x-2">
         

          {/* Dots for remaining pages */}
          {Array.from({ length: totalPages }).map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-[#ff970a]' : 'bg-gray-500'}`}></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselComponent;
