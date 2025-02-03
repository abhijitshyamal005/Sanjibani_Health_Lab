/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect } from 'react';
import { fetchCart } from '../utils/cartUtils';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [cartVersion, setCartVersion] = useState(0);

  const refreshCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCart({ items: [], totalPrice: 0 });
        return;
      }
      const cartData = await fetchCart(token);
      setCart(cartData || { items: [], totalPrice: 0 });
      setCartVersion(v => v + 1);
    } catch (error) {
      console.error('Error refreshing cart:', error);
    }
  };

  // Initial cart load
  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ cart, refreshCart, cartVersion }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);