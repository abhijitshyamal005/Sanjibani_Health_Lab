/* eslint-disable no-unused-vars */
import { useState } from 'react';
import CardComponent from './CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import { addToCart } from "../utils/cartUtils";
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../context/CartContext';


const cards = [
  { id: uuidv4(), title: "Full Body Checkup - Essential", price: "₹1599", oldPrice: "₹6063", discount: "74% Off", parameters: "91", reportTime: "within 7 hours", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Comprehensive", price: "₹3599", oldPrice: "₹13663", discount: "74% Off", parameters: "107", reportTime: "by Today", link: "/full-body-cos" },
  { id: uuidv4(), title: "Full Body Checkup - Advanced", price: "₹5999", oldPrice: "₹16000", discount: "70% Off", parameters: "120", reportTime: "by Tomorrow", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Premium", price: "₹7999", oldPrice: "₹18000", discount: "65% Off", parameters: "150", reportTime: "within 24 hours", link: "/full-body-cos" },
  { id: uuidv4(), title: "Full Body Checkup - Platinum", price: "₹10999", oldPrice: "₹22000", discount: "50% Off", parameters: "200", reportTime: "within 2 days", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Executive", price: "₹12999", oldPrice: "₹24000", discount: "45% Off", parameters: "250", reportTime: "within 1 day", link: "/full-body-cos" },
];


const CarouselComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalPages = Math.ceil(cards.length / 3);
  const navigate = useNavigate();
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

  const handleViewDetails = (link) => {
    navigate(link);
  };

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login first!");
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
    } catch (error) {
      toast.error("Failed to add to cart.");
    }
  };
  
  


  return (
    <div className="relative flex flex-col mt-12 mb-10 px-4 sm:px-0">
      <h2 className="text-xl sm:text-2xl text-gray-800 font-bold mb-4 text-center">
        5 Full body checkups In Kolkata
      </h2>

      {/* Center the cards and buttons */}
      <div className="relative flex justify-center items-center">
        <button
          onClick={prev}
          className="absolute left-0 sm:left-5 top-1/2 transform -translate-y-1/2 text-black border-black border rounded-full px-3 py-1 bg-white z-10"
        >
          ❮
        </button>

        <div className="flex overflow-hidden max-w-full sm:max-w-5xl space-x-4 pb-10">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
          >
            {cards.map((card, index) => (
              <div key={index} className="min-w-[60%] sm:min-w-[27%]">
                <CardComponent
                  title={card.title}
                  price={card.price}
                  oldPrice={card.oldPrice}
                  discount={card.discount}
                  parameters={card.parameters}
                  reportTime={card.reportTime}
                  onViewDetails={() => handleViewDetails(card.link)}
                  onAddToCart={() => handleAddToCart(card)}  // Pass the whole card object
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={next}
          className="absolute right-0 sm:right-5 top-1/2 transform -translate-y-1/2 text-black border-black border rounded-full px-3 py-1 bg-white z-10"
        >
          ❯
        </button>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 text-xs space-x-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 bg-gray-500 rounded-full ${i === currentIndex ? 'bg-gray-800' : ''}`}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default CarouselComponent;
