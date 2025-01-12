import CardComponent from '../../CardComponent.jsx';
import { useNavigate } from 'react-router-dom'; 
import WhatsappImg from '../../WhatsappImg.jsx';

const cards = [
  { title: "Kidney Function Test (KFT)", price: "₹900", oldPrice: "₹1100", discount: "18% Off", parameters: "5", reportTime: "within 12 hours", link: "/not-found" },
  { title: "Complete Renal Profile", price: "₹1500", oldPrice: "₹1800", discount: "17% Off", parameters: "8", reportTime: "within 24 hours", link: "/not-found" },
  { title: "Creatinine Test", price: "₹400", oldPrice: "₹500", discount: "20% Off", parameters: "1", reportTime: "within 6 hours", link: "/not-found" },
  { title: "Blood Urea Nitrogen (BUN) Test", price: "₹350", oldPrice: "₹450", discount: "22% Off", parameters: "1", reportTime: "within 12 hours", link: "/not-found" },
  { title: "Uric Acid Test", price: "₹450", oldPrice: "₹550", discount: "18% Off", parameters: "1", reportTime: "by Tomorrow", link: "/not-found" },
  { title: "Electrolytes Test", price: "₹600", oldPrice: "₹750", discount: "20% Off", parameters: "3", reportTime: "within 24 hours", link: "/not-found" },
];

const CarouselComponent = () => {
  const navigate = useNavigate(); // for navigation

  const handleViewDetails = (link) => {
    // Redirect to a specific details page using the link
    if (link && link !== '/not-found') {
      navigate(link);
    } else {
      // Handle the case where the link is not valid
      console.error("Invalid link:", link);
    }
  };

  const handleAddToCart = (title) => {
    // Implement adding the specific product to a cart here
    alert(`Added "${title}" to cart!`);
  };

  return (
    <>
      <div className="flex flex-col items-center mt-32 justify-center mb-10">
        <h2 className="text-xl text-gray-500 font-bold text-start mb-6">Showing {cards.length} Kidney Tests/Checkups</h2>

        {/* Display all cards in a grid layout and center them */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 w-full max-w-6xl px-4">
          {cards.map((card, index) => (
            <div
              key={index}
              className="max-w-sm mx-auto bg-white rounded-lg p-4" // Increased card size
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
