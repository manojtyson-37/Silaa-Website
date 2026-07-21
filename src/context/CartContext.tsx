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

type State = { items: CartItem[]; open: boolean; discountCode: string };

type Action =
  | { type: "add"; item: CartItem }
  | { type: "remove"; variantId: number }
  | { type: "qty"; variantId: number; qty: number }
  | { type: "clear" }
  | { type: "setOpen"; open: boolean }
  | { type: "setDiscountCode"; code: string }
  | { type: "hydrate"; items: CartItem[]; discountCode: string };

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
      return { ...state, items, open: true };
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
    case "setDiscountCode":
      return { ...state, discountCode: action.code };
    case "hydrate":
      return { ...state, items: action.items, discountCode: action.discountCode };
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
  discountCode: string;
  setOpen: (open: boolean) => void;
  setDiscountCode: (code: string) => void;
} | null>(null);

const STORAGE_KEY = "sila-cart-v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false, discountCode: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        const parsedData = Array.isArray(parsed) ? { items: parsed, discountCode: "" } : (parsed as { items?: unknown, discountCode?: string } || {});
        const rawItems = Array.isArray(parsedData.items) ? parsedData.items : [];
        const items = rawItems
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
        dispatch({ type: "hydrate", items, discountCode: parsedData.discountCode || "" });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items, discountCode: state.discountCode }));
    } catch {}
  }, [state.items, state.discountCode, hydrated]);

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
      discountCode: state.discountCode,
      setDiscountCode: (code: string) => dispatch({ type: "setDiscountCode", code }),
    };
  }, [state]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
