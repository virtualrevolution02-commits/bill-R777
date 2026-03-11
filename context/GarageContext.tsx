import React, { createContext, useContext, useState, ReactNode } from "react";

export type SparePart = {
  id: string;
  name: string;
  price: number;
  image: any;
};

export type CartItem = SparePart & { quantity: number };

export type LabourItem = {
  id: string;
  name: string;
  price: number;
};

type GarageContextType = {
  cart: CartItem[];
  addToCart: (part: SparePart) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  labourItems: LabourItem[];
  addLabour: (item: LabourItem) => void;
  removeLabour: (id: string) => void;
  grandTotal: number;
};

const GarageContext = createContext<GarageContextType | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [labourItems, setLabourItems] = useState<LabourItem[]>([
    { id: "labour-1", name: "Service", price: 300 },
  ]);

  const addToCart = (part: SparePart) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === part.id);
      if (existing) {
        return prev.map((item) =>
          item.id === part.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...part, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addLabour = (item: LabourItem) => {
    setLabourItems((prev) => [...prev, item]);
  };

  const removeLabour = (id: string) => {
    setLabourItems((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const labourTotal = labourItems.reduce((sum, item) => sum + item.price, 0);

  const grandTotal = cartTotal + labourTotal;

  return (
    <GarageContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        labourItems,
        addLabour,
        removeLabour,
        grandTotal,
      }}
    >
      {children}
    </GarageContext.Provider>
  );
}

export function useGarage(): GarageContextType {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage must be used within GarageProvider");
  return ctx;
}
