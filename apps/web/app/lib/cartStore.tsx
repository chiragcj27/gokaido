"use client";

// Client-side cart state, persisted to localStorage — stands in for the
// real `Cart` document (see CLAUDE.md "Data Models Needed") until the
// API wiring exists. Phase 1 scope only calls for a persistent
// localStorage/cookie cart, so this is the whole store for now.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "gokaido:cart";

export const FREE_SHIPPING_THRESHOLD = 5000;

export interface CartItem {
  id: string;
  productSlug: string;
  name: string;
  category: string;
  imageSrc: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

export interface AddCartItemInput extends Omit<CartItem, "quantity"> {
  quantity?: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: AddCartItemInput) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage unavailable (e.g. private browsing) — start with an empty cart
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage unavailable — cart just won't persist across reloads
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: AddCartItemInput) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.id === item.id);
      if (existing) {
        return prev.map((line) =>
          line.id === item.id ? { ...line, quantity: line.quantity + (item.quantity ?? 1) } : line,
        );
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }];
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => prev.map((line) => (line.id === id ? { ...line, quantity } : line)));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart }),
    [items, addItem, updateQuantity, removeItem, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
