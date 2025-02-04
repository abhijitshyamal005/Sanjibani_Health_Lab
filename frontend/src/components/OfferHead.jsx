/* eslint-disable no-unused-vars */
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { addToCart } from "../utils/cartUtils";
import { useCart } from "../context/CartContext";

const OfferHead = () => {
  const cart = [{ id: uuidv4(), title: "Rapid Dengue Testing", price: "₹750" }];
  
  const navigate = useNavigate();
  const { refreshCart } = useCart();

  const handleAddToCart = async (product) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first!");
      navigate("/login");
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
    <div className="bg-[#244c44] w-full h-auto flex flex-col md:flex-row items-center p-4 md:p-5 justify-center space-y-2 md:space-y-0 md:space-x-4">
      {/* Container for text */}
      <Link className="text-white text-base md:text-lg text-center md:text-left">
        Get an <span className="font-semibold underline">Rapid Dengue Testing</span> with Accurate Reports in 6 hours @{" "}
        <span className="font-semibold underline">₹750/-</span>
      </Link>

      {/* Button */}
      <Link
        to="/checkup"
        onClick={() => handleAddToCart(cart[0])} // Pass the correct product
        className="bg-gradient-to-r from-[#ff970a] to-[#ffac3b] text-white hover:shadow-lg hover:shadow-gray-300 transition-all duration-300 rounded-lg px-4 py-2 md:px-5 md:py-2 text-center"
      >
        <span className="text-sm md:text-base font-medium">BOOK NOW</span>
      </Link>
    </div>
  );
};

export default OfferHead;
