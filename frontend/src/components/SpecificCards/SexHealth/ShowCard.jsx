import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom'; 
import WhatsappImg from '../../WhatsappImg.jsx';
import { toast } from 'react-toastify';
import { addToCart } from '../../../utils/cartUtils.js';
import { useCart } from '../../../context/CartContext.jsx';
import { v4 as uuidv4 } from 'uuid';

const cards = [
  {id: uuidv4(), title: "Sexual Health Checkup - Basic", price: "₹1200", oldPrice: "₹1500", discount: "20% Off", parameters: "4", reportTime: "within 24 hours", link: "/sexual-health-basic" },
  {id: uuidv4(), title: "Sexual Health Checkup - Comprehensive", price: "₹2500", oldPrice: "₹3000", discount: "17% Off", parameters: "8", reportTime: "within 48 hours", link: "/sexual-health-comprehensive" },
  {id: uuidv4(), title: "STD Screening Test", price: "₹800", oldPrice: "₹1000", discount: "20% Off", parameters: "3", reportTime: "within 12 hours", link: "/std-screening" },
  {id: uuidv4(), title: "HIV Test", price: "₹1000", oldPrice: "₹1200", discount: "17% Off", parameters: "1", reportTime: "within 6 hours", link: "/hiv-test" },
  {id: uuidv4(), title: "Hepatitis B & C Test", price: "₹1500", oldPrice: "₹1800", discount: "15% Off", parameters: "2", reportTime: "within 24 hours", link: "/hepatitis-test" },
  {id: uuidv4(), title: "VDRL Test (Syphilis Test)", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "1", reportTime: "by Tomorrow", link: "/vdrl-test" },
];

const CarouselComponent = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const handleViewDetails = (card) => {
    navigate('/view-details', { state: { selectedTest: card } });
  };

  const handleAddToCart = async (product) => {
     const token = localStorage.getItem('token');
     if (!token) {
       toast.error("Please login first!");
       navigate('/login');
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
    <>
      <div className="flex flex-col items-center mt-32 mb-10 px-4">
        <h2 className="text-lg md:text-xl lg:text-2xl text-gray-500 font-bold text-center mb-6">
          Showing 5 tests/checkups Body Checkups in Kolkata
        </h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8 w-full max-w-6xl">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 shadow-md mx-auto"
            >
              <CardComponent
                title={card.title}
                price={card.price}
                oldPrice={card.oldPrice}
                discount={card.discount}
                parameters={card.parameters}
                reportTime={card.reportTime}
                onViewDetails={() => handleViewDetails(card)} // Pass the link handler
                onAddToCart={() => handleAddToCart(card)}
              />
            </div>
          ))}
        </div>
      </div>
      <WhatsappImg />
    </>
  );
};

export default CarouselComponent;
