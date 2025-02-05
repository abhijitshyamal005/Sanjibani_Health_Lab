import { useState } from 'react';
import CardComponent from '../CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { toast } from 'react-toastify';
import { addToCart } from '../../utils/cartUtils.js';
import { v4 as uuidv4 } from 'uuid';


const cards = [
  { id: uuidv4(), title: "Kidney Function Test (KFT)", price: "₹900", oldPrice: "₹1100", discount: "18% Off", parameters: "5", reportTime: "within 12 hours" },
  {id:uuidv4(), title: "Complete Renal Profile", price: "₹1500", oldPrice: "₹1800", discount: "17% Off", parameters: "8", reportTime: "within 24 hours" },
  { id: uuidv4(), title: "Creatinine Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "within 6 hours" },
  { id: uuidv4(), title: "Blood Urea Nitrogen (BUN) Test", price: "₹350", oldPrice: "₹450", discount: "22% Off", parameters: "1", reportTime: "within 12 hours" },
  { id: uuidv4(), title: "Uric Acid Test", price: "₹450", oldPrice: "₹550", discount: "18% Off", parameters: "1", reportTime: "by Tomorrow" },
  { id: uuidv4(), title: "Electrolytes Test", price: "₹600", oldPrice: "₹750", discount: "20% Off", parameters: "3", reportTime: "within 24 hours" },
];

const CarouselComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(cards.length / itemsPerPage); 
  const { Navigate}= useNavigate();
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
  const handleViewDetails = (card) => {
    Navigate('/view-details', { state: { selectedTest: card } });
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
    <div className="relative bg-gradient-to-t from-gray-100 to-gray-50 flex flex-col mt-12 mb-10 px-4">
      <div className='mt-12 mb-12'>
        <h2 className="text-xl text-gray-800 font-bold mb-4 text-center md:text-left">Kidney Tests In Kolkata</h2>
        
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
                <div key={index} className="min-w-[33%] md:min-w-[27%] px-2">
                  <CardComponent
                    title={card.title}
                    price={card.price}
                    oldPrice={card.oldPrice}
                    discount={card.discount}
                    parameters={card.parameters}
                    reportTime={card.reportTime}
                    onViewDetails={()=>handleViewDetails(card)}
                    onAddToCart={() => handleAddToCart(card)}
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
            <span key={i} className={`w-2 h-2 bg-gray-500 rounded-full ${i === currentIndex ? 'bg-orange-500' : ''}`}></span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CarouselComponent;
