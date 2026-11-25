import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'sanjibani.cart';
const EMPTY = { lab: null, items: [] };
const CartContext = createContext(null);

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return parsed?.lab && Array.isArray(parsed.items) ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

const labSummary = (lab) => ({
  _id: lab._id,
  name: lab.name,
  slug: lab.slug,
  area: lab.address?.area,
  city: lab.address?.city,
  homeCollection: lab.homeCollection,
  homeCollectionFee: lab.homeCollectionFee,
  assistedVisit: Boolean(lab.assistedVisit),
  assistedVisitFee: lab.assistedVisitFee || 0,
  coverTheme: lab.coverTheme,
});

const itemSummary = (t) => ({
  _id: t._id,
  name: t.name,
  price: t.price,
  mrp: t.mrp,
  category: t.category,
  type: t.type,
  homeCollection: t.homeCollection,
});

/**
 * One lab per cart, like ordering from one restaurant at a time.
 * add() returns 'conflict' when the test belongs to a different lab; call replaceWith() to switch.
 */
export function CartProvider({ children }) {
  const [cart, setCart] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(cart));
    } catch {
      /* storage unavailable */
    }
  }, [cart]);

  const add = useCallback(
    (lab, test) => {
      if (cart.lab && cart.lab._id !== lab._id) return 'conflict';
      setCart((c) => {
        if (c.items.some((i) => i._id === test._id)) return c;
        return { lab: labSummary(lab), items: [...c.items, itemSummary(test)] };
      });
      return 'added';
    },
    [cart.lab]
  );

  const replaceWith = useCallback((lab, test) => setCart({ lab: labSummary(lab), items: [itemSummary(test)] }), []);

  const remove = useCallback(
    (testId) =>
      setCart((c) => {
        const items = c.items.filter((i) => i._id !== testId);
        return items.length ? { ...c, items } : EMPTY;
      }),
    []
  );

  const clear = useCallback(() => setCart(EMPTY), []);

  const value = useMemo(() => {
    const subtotal = cart.items.reduce((s, i) => s + i.price, 0);
    const mrpTotal = cart.items.reduce((s, i) => s + (i.mrp || i.price), 0);
    return {
      ...cart,
      count: cart.items.length,
      subtotal,
      savings: mrpTotal - subtotal,
      has: (id) => cart.items.some((i) => i._id === id),
      add,
      replaceWith,
      remove,
      clear,
    };
  }, [cart, add, replaceWith, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
