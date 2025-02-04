import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import WhatsappImg from '../../WhatsappImg.jsx';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../../../context/CartContext.jsx';
import { addToCart } from '../../../utils/cartUtils.js';

const cards = [
  { id: uuidv4(), title: "Full Body Checkup - Essential", price: "₹1599", oldPrice: "₹6063", discount: "74% Off", parameters: "91", reportTime: "within 7 hours", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Comprehensive", price: "₹3599", oldPrice: "₹13663", discount: "74% Off", parameters: "107", reportTime: "by Today", link: "/full-body-cos" },
  { id: uuidv4(), title: "Full Body Checkup - Advanced", price: "₹5999", oldPrice: "₹16000", discount: "70% Off", parameters: "120", reportTime: "by Tomorrow", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Premium", price: "₹7999", oldPrice: "₹18000", discount: "65% Off", parameters: "150", reportTime: "within 24 hours", link: "/full-body-cos" },
  { id: uuidv4(), title: "Full Body Checkup - Platinum", price: "₹10999", oldPrice: "₹22000", discount: "50% Off", parameters: "200", reportTime: "within 2 days", link: "/full-body-es" },
  { id: uuidv4(), title: "Full Body Checkup - Executive", price: "₹12999", oldPrice: "₹24000", discount: "45% Off", parameters: "250", reportTime: "within 1 day", link: "/full-body-cos" },
];

const CarouselComponent = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const handleViewDetails = (link) => {
    // Redirect to a specific details page using the link
    navigate(link);
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
      <div className="flex flex-col items-center mt-16 sm:mt-24 mb-10 px-4">
        <h2 className="text-lg sm:text-xl lg:text-2xl text-gray-500 font-bold text-center mb-6">Showing Body Checkups in Kolkata</h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-4" 
            >
              <CardComponent
                title={card.title}
                price={card.price}
                oldPrice={card.oldPrice}
                discount={card.discount}
                parameters={card.parameters}
                reportTime={card.reportTime}
                onViewDetails={() => handleViewDetails(card.link)} // Pass the link handler
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
