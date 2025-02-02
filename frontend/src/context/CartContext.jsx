/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [cartVersion, setCartVersion] = useState(0); // Used to trigger refreshes

    return (
        <CartContext.Provider value={{ cart, setCart, cartVersion, refreshCart: () => setCartVersion(v => v + 1) }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};