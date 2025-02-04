import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom'; 
import WhatsappImg from '../../WhatsappImg.jsx';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { useCart } from '../../../context/CartContext.jsx';
import { addToCart } from '../../../utils/cartUtils.js';



const cards = [
  { id: uuidv4(), title: "Typhoid Fever Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "within 6 hours", link: "/typhoid-test" },
  { id: uuidv4(), title: "Dengue Fever Test", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "2", reportTime: "within 24 hours", link: "/dengue-test" },
  { id: uuidv4(), title: "Malaria Test", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 12 hours", link: "/malaria-test" },
  { id: uuidv4(), title: "Chikungunya Test", price: "₹550", oldPrice: "₹650", discount: "15% Off", parameters: "1", reportTime: "by Tomorrow", link: "/chikungunya-test" },
  { id: uuidv4(), title: "Viral Fever Profile", price: "₹600", oldPrice: "₹750", discount: "20% Off", parameters: "5", reportTime: "within 2 days", link: "/viral-fever-profile" },
  { id: uuidv4(), title: "Influenza (Flu) Test", price: "₹800", oldPrice: "₹950", discount: "16% Off", parameters: "3", reportTime: "by Today", link: "/influenza-test" },
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
      <div className="flex flex-col items-center mt-8 md:mt-16 mb-10 px-4">
        <h2 className="text-lg sm:text-xl md:text-2xl text-gray-500 font-bold text-center mb-6">
          Showing 5 tests/checkups Body Checkups in Kolkata
        </h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
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
                onViewDetails={() => handleViewDetails(card.link)} 
                onAddToCart={() => handleAddToCart(card)} 
              />
            </div>
          ))}
        </div>
      </div>
      <WhatsappImg/>
    </>
  );
};

export default CarouselComponent;
