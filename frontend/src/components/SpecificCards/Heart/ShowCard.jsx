import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom';
import WhatsappImg from '../../WhatsappImg.jsx';
import { toast } from 'react-toastify';
import { addToCart } from '../../../utils/cartUtils.js';
import { useCart } from '../../../context/CartContext.jsx';
import { v4 as uuidv4 } from 'uuid';

const cards = [
  { id: uuidv4(), title: "Lipid Profile Test", price: "₹800", oldPrice: "₹1000", discount: "20% Off", parameters: "6", reportTime: "within 12 hours", link: "/lipid-profile" },
  { id: uuidv4(), title: "Complete Cardiac Profile", price: "₹2000", oldPrice: "₹2500", discount: "20% Off", parameters: "10", reportTime: "within 24 hours", link: "/cardiac-profile" },
  { id: uuidv4(), title: "ECG (Electrocardiogram)", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 1 hour", link: "/ecg" },
  { id: uuidv4(), title: "Echocardiogram (Echo)", price: "₹1500", oldPrice: "₹1800", discount: "17% Off", parameters: "1", reportTime: "within 2 hours", link: "/echo" },
  { id: uuidv4(), title: "Troponin Test", price: "₹1200", oldPrice: "₹1400", discount: "14% Off", parameters: "1", reportTime: "within 6 hours", link: "/troponin-test" },
  { id: uuidv4(), title: "CT Angiography", price: "₹3500", oldPrice: "₹4000", discount: "12% Off", parameters: "1", reportTime: "by Tomorrow", link: "/ct-angiography" },
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
      <div className="flex flex-col items-center mt-32 justify-center mb-10">
        <h2 className="text-xl text-gray-500 font-bold text-start mb-6">Showing 6 Cardiac Tests in Kolkata</h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-6xl px-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="max-w-sm mx-auto bg-white rounded-lg shadow-lg p-4" // Added shadow for better visual
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
