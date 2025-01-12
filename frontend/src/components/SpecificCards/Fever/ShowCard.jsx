import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom'; 
import WhatsappImg from '../../WhatsappImg.jsx';

const cards = [
  { title: "Typhoid Fever Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "within 6 hours", link: "/typhoid-test" },
  { title: "Dengue Fever Test", price: "₹700", oldPrice: "₹850", discount: "18% Off", parameters: "2", reportTime: "within 24 hours", link: "/dengue-test" },
  { title: "Malaria Test", price: "₹500", oldPrice: "₹600", discount: "17% Off", parameters: "1", reportTime: "within 12 hours", link: "/malaria-test" },
  { title: "Chikungunya Test", price: "₹550", oldPrice: "₹650", discount: "15% Off", parameters: "1", reportTime: "by Tomorrow", link: "/chikungunya-test" },
  { title: "Viral Fever Profile", price: "₹600", oldPrice: "₹750", discount: "20% Off", parameters: "5", reportTime: "within 2 days", link: "/viral-fever-profile" },
  { title: "Influenza (Flu) Test", price: "₹800", oldPrice: "₹950", discount: "16% Off", parameters: "3", reportTime: "by Today", link: "/influenza-test" },
];

const CarouselComponent = () => {
  const navigate = useNavigate(); // for navigation

  const handleViewDetails = (link) => {
    // Redirect to a specific details page using the link
    navigate(link);
  };

  const handleAddToCart = (title) => {
    // You can implement adding the specific product to a cart here
    alert(`Added "${title}" to cart!`);
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
                onViewDetails={() => handleViewDetails(card.link)} // Pass the link handler
                onAddToCart={() => handleAddToCart(card.title)} // Pass the title to cart handler
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
