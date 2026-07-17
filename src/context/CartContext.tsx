"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

export type CartItem = {
  variantId: number;
  productId: number;
  handle: string;
  title: string;
  size: string;
  price: number;
  image: string;
  qty: number;
};

type State = { items: CartItem[]; open: boolean };

type Action =
  | { type: "add"; item: CartItem }
  | { type: "remove"; variantId: number }
  | { type: "qty"; variantId: number; qty: number }
  | { type: "clear" }
  | { type: "setOpen"; open: boolean }
  | { type: "hydrate"; items: CartItem[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "add": {
      const existing = state.items.find(
        (i) => i.variantId === action.item.variantId
      );
      const items = existing
        ? state.items.map((i) =>
            i.variantId === action.item.variantId
              ? { ...i, qty: Math.min(10, i.qty + action.item.qty) }
              : i
          )
        : [...state.items, action.item];
      return { items, open: true };
    }
    case "remove":
      return {
        ...state,
        items: state.items.filter((i) => i.variantId !== action.variantId),
      };
    case "qty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.variantId === action.variantId
            ? { ...i, qty: Math.max(1, Math.min(10, action.qty)) }
            : i
        ),
      };
    case "clear":
      return { ...state, items: [] };
    case "setOpen":
      return { ...state, open: action.open };
    case "hydrate":
      return { ...state, items: action.items };
  }
}

const CartContext = createContext<{
  items: CartItem[];
  open: boolean;
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  remove: (variantId: number) => void;
  setQty: (variantId: number, qty: number) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
} | null>(null);

const STORAGE_KEY = "sila-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const items = (Array.isArray(parsed) ? parsed : [])
          .filter(
            (i): i is CartItem =>
              !!i &&
              typeof i === "object" &&
              Number.isFinite(Number((i as CartItem).variantId)) &&
              Number.isFinite(Number((i as CartItem).price)) &&
              typeof (i as CartItem).title === "string" &&
              typeof (i as CartItem).handle === "string"
          )
          .map((i) => ({
            ...i,
            price: Number(i.price),
            qty: Math.max(1, Math.min(10, Math.floor(Number(i.qty)) || 1)),
          }));
        dispatch({ type: "hydrate", items });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {}
  }, [state.items, hydrated]);

  const value = useMemo(() => {
    const count = state.items.reduce((n, i) => n + i.qty, 0);
    const subtotal = state.items.reduce((n, i) => n + i.price * i.qty, 0);
    return {
      items: state.items,
      open: state.open,
      count,
      subtotal,
      add: (item: CartItem) => dispatch({ type: "add", item }),
      remove: (variantId: number) => dispatch({ type: "remove", variantId }),
      setQty: (variantId: number, qty: number) =>
        dispatch({ type: "qty", variantId, qty }),
      clear: () => dispatch({ type: "clear" }),
      setOpen: (open: boolean) => dispatch({ type: "setOpen", open }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
