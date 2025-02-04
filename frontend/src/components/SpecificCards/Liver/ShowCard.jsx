import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import WhatsappImg from '../../WhatsappImg.jsx';
import { addToCart } from '../../../utils/cartUtils.js';
import { toast } from 'react-toastify';
import { useCart } from '../../../context/CartContext.jsx';
import { v4 as uuidv4 } from 'uuid';

const cards = [
  { id: uuidv4(), title: "Liver Function Test (LFT)", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "7", reportTime: "within 12 hours", link: "/not-found" },
  { id: uuidv4(), title: "Complete Liver Profile", price: "₹1200", oldPrice: "₹1500", discount: "20% Off", parameters: "10", reportTime: "within 24 hours", link: "/not-found" },
  { id: uuidv4(), title: "Bilirubin Test", price: "₹300", oldPrice: "₹400", discount: "25% Off", parameters: "1", reportTime: "within 6 hours", link: "/not-found" },
  { id: uuidv4(), title: "SGPT/ALT Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "by Tomorrow", link: "/not-found" },
  { id: uuidv4(), title: "SGOT/AST Test", price: "₹450", oldPrice: "₹550", discount: "18% Off", parameters: "1", reportTime: "within 12 hours", link: "/not-found" },
  { id: uuidv4(), title: "Alkaline Phosphatase Test", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 24 hours", link: "/not-found" },
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
      <div className="flex flex-col items-center mt-32 mb-10 px-4">
        <h2 className="text-lg md:text-xl lg:text-2xl text-gray-500 font-bold text-center mb-6">
          Showing 5 tests/checkups Body Checkups in Kolkata
        </h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
          {cards.map((card, index) => (
            <div
              key={index}
              className="max-w-xs sm:max-w-sm bg-white rounded-lg p-4 shadow-md" // Adjust card size for smaller screens
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
