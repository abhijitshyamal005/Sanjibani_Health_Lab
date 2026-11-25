import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'sanjibani.cart';
export const MAX_CART_LABS = 5;
const EMPTY = { groups: [] };
const CartContext = createContext(null);

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(parsed?.groups)) {
      return { groups: parsed.groups.filter((g) => g?.lab?._id && Array.isArray(g.items) && g.items.length) };
    }
    // Carts saved before multi-lab booking held a single { lab, items }.
    if (parsed?.lab && Array.isArray(parsed.items) && parsed.items.length) return { groups: [{ lab: parsed.lab, items: parsed.items }] };
    return EMPTY;
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
  upiEnabled: Boolean(lab.upiId),
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
 * The cart is grouped by lab: one patient can book tests from several labs in one checkout.
 * Each lab group becomes its own booking (its own lab team and sample collector).
 * add() returns 'added', or 'limit' when the cart already holds MAX_CART_LABS labs.
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
      const exists = cart.groups.some((g) => g.lab._id === lab._id);
      if (!exists && cart.groups.length >= MAX_CART_LABS) return 'limit';
      setCart((c) => {
        const idx = c.groups.findIndex((g) => g.lab._id === lab._id);
        if (idx === -1) return { groups: [...c.groups, { lab: labSummary(lab), items: [itemSummary(test)] }] };
        if (c.groups[idx].items.some((i) => i._id === test._id)) return c;
        const groups = c.groups.slice();
        groups[idx] = { lab: labSummary(lab), items: [...groups[idx].items, itemSummary(test)] };
        return { groups };
      });
      return 'added';
    },
    [cart.groups]
  );

  const remove = useCallback(
    (testId) =>
      setCart((c) => ({
        groups: c.groups.map((g) => ({ ...g, items: g.items.filter((i) => i._id !== testId) })).filter((g) => g.items.length),
      })),
    []
  );

  const removeLab = useCallback((labId) => setCart((c) => ({ groups: c.groups.filter((g) => g.lab._id !== labId) })), []);
  const clear = useCallback(() => setCart(EMPTY), []);

  const value = useMemo(() => {
    const items = cart.groups.flatMap((g) => g.items);
    const subtotal = items.reduce((s, i) => s + i.price, 0);
    const mrpTotal = items.reduce((s, i) => s + (i.mrp || i.price), 0);
    return {
      groups: cart.groups,
      items,
      labCount: cart.groups.length,
      count: items.length,
      subtotal,
      savings: mrpTotal - subtotal,
      has: (id) => items.some((i) => i._id === id),
      hasLab: (labId) => cart.groups.some((g) => g.lab._id === labId),
      add,
      remove,
      removeLab,
      clear,
    };
  }, [cart, add, remove, removeLab, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
