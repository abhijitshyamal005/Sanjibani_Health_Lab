import { useEffect, useState } from 'react';
import CardComponent from '../CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { addToCart } from '../../utils/cartUtils.js';

const cards = [
  { id: uuidv4(), title: "Liver Function Test (LFT)", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "7", reportTime: "within 12 hours" },
  { id: uuidv4(),title: "Complete Liver Profile", price: "₹1200", oldPrice: "₹1500", discount: "20% Off", parameters: "10", reportTime: "within 24 hours" },
  {id: uuidv4(), title: "Bilirubin Test", price: "₹300", oldPrice: "₹400", discount: "25% Off", parameters: "1", reportTime: "within 6 hours" },
  {id: uuidv4(), title: "SGPT/ALT Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "by Tomorrow" },
  {id: uuidv4(), title: "SGOT/AST Test", price: "₹450", oldPrice: "₹550", discount: "18% Off", parameters: "1", reportTime: "within 12 hours" },
  {id: uuidv4(), title: "Alkaline Phosphatase Test", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 24 hours" },
];

const CarouselComponent = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(3);
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  useEffect(() => {
    const updateCardsPerPage = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) setCardsPerPage(1);
      else if (screenWidth < 1024) setCardsPerPage(2);
      else setCardsPerPage(3);
    };

    updateCardsPerPage();
    window.addEventListener('resize', updateCardsPerPage);
    return () => window.removeEventListener('resize', updateCardsPerPage);
  }, []);

  const totalPages = Math.ceil(cards.length / cardsPerPage);

  const handleNavigation = (direction) => {
    setCurrentIndex(prev => {
      const newIndex = direction === 'next' ? prev + 1 : prev - 1;
      return Math.max(0, Math.min(newIndex, totalPages - 1));
    });
  };

  const handleViewDetails = (card) => {
    navigate(card.link, { state: { selectedTest: card } });
  };

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login');
      return;
    }

    try {
      await addToCart(
        product.id,
        1,
        { title: product.title, price: product.price },
        token
      );
      refreshCart();
      toast.success(`${product.title} added to cart`);
    } catch (error) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  return (
    <section className=" max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold text-gray-900 md:text-start text-center mb-8">
      Liver Tests In Kolkata
      </h2>

      <div className="relative group">
        {/* Navigation Arrows */}
        <button
          onClick={() => handleNavigation('prev')}
          className="hidden sm:flex absolute -left-24 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow z-10"
          disabled={currentIndex === 0}
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => handleNavigation('next')}
          className="hidden sm:flex absolute -right-24 top-1/2 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow z-10"
          disabled={currentIndex === totalPages - 1}
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Carousel Container */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out "
            style={{
              transform: `translateX(-${currentIndex * (100 / (window.innerWidth < 768 ? 1 : 2.5))}%) `, 
              
            }}
          >
            {cards.map((card) => (
              <div
                key={card.id}
                className="flex-shrink-0"
                style={{
                  width: window.innerWidth < 768 ? '100%' : `${100 / 2.5}%`, 
                   
                }}
              >
                <CardComponent
                  {...card}
                  onViewDetails={() => handleViewDetails(card)}
                  onAddToCart={() => handleAddToCart(card)}
                  className="flex flex-col items-center"
                />
              </div>
            ))}
          </div>
        </div>


        {/* Mobile Navigation Buttons */}
        <div className="sm:hidden flex justify-center gap-4 mt-6">
          <button
            onClick={() => handleNavigation('prev')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            disabled={currentIndex === 0}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => handleNavigation('next')}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
            disabled={currentIndex === totalPages - 1}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Pagination Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-orange-600' : 'bg-gray-300 hover:bg-gray-400'
                }`}
              aria-label={`Go to page ${idx + 1}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default CarouselComponent;
