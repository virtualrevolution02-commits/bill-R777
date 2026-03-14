import React, { createContext, useContext, useState, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type SparePart = {
  id: string;
  name: string;
  price: number;
  category: string;
  brand: string;
  image?: any;
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
  decreaseQuantity: (id: string) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  cartTotal: number;
  advanceAmount: number;
  setAdvanceAmount: (amount: number) => void;
  labourItems: LabourItem[];
  addLabour: (item: LabourItem) => void;
  removeLabour: (id: string) => void;
  updatePartPrice: (id: string, price: number) => void;
  updateLabourPrice: (id: string, price: number) => void;
  finalizeBill: () => Promise<void>;
  grandTotal: number;
  finalBalance: number;
  customerName: string;
  setCustomerName: (name: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (num: string) => void;
  resetGarage: () => void;
  currentBillId: string | null;
};

const GarageContext = createContext<GarageContextType | null>(null);

export function GarageProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [labourItems, setLabourItems] = useState<LabourItem[]>([
    { id: "labour-1", name: "Service", price: 300 },
  ]);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [currentBillId, setCurrentBillId] = useState<string | null>(null);

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

  const decreaseQuantity = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== id);
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

  const updatePartPrice = (id: string, price: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  };

  const updateLabourPrice = (id: string, price: number) => {
    setLabourItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, price } : item))
    );
  };

  const finalizeBill = async () => {
    const billId = currentBillId || `bill-${Date.now()}`;
    const billData = {
      id: billId,
      items: { cart, labourItems },
      advance: advanceAmount,
      total: grandTotal,
      finalBalance: finalBalance,
      customerName,
      vehicleNumber,
      date: new Date().toISOString(),
    };

    try {
      // Save locally first for offline support
      const existingBillsString = await AsyncStorage.getItem('offline_bills');
      let bills = existingBillsString ? JSON.parse(existingBillsString) : [];
      
      const existingIndex = bills.findIndex((b: any) => b.id === billId);
      if (existingIndex >= 0) {
        // Update existing bill
        bills[existingIndex] = billData;
        console.log('Bill updated locally');
      } else {
        // Add new bill
        bills.push(billData);
        console.log('Bill saved locally');
      }
      
      await AsyncStorage.setItem('offline_bills', JSON.stringify(bills));
      setCurrentBillId(billId);
    } catch (localErr) {
      console.error('Failed to save bill locally', localErr);
      throw new Error('Failed to save bill locally');
    }

    try {
      const baseUrl = Platform.OS === 'web' ? '' : 'http://localhost:5000';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${baseUrl}/api/bills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(billData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Failed to save bill to server');
      }
      
      console.log('Bill synced to server successfully');
    } catch (err) {
      console.log('Saved offline. Server sync failed:', err);
      // We don't throw here to allow the app to proceed offline
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const labourTotal = labourItems.reduce((sum, item) => sum + item.price, 0);

  const grandTotal = cartTotal + labourTotal;
  const finalBalance = grandTotal - advanceAmount;

  const resetGarage = () => {
    setCart([]);
    setLabourItems([{ id: "labour-1", name: "Service", price: 300 }]);
    setAdvanceAmount(0);
    setCustomerName("");
    setVehicleNumber("");
    setCurrentBillId(null);
  };

  return (
    <GarageContext.Provider
      value={{
        cart,
        addToCart,
        decreaseQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        labourItems,
        addLabour,
        removeLabour,
        updatePartPrice,
        updateLabourPrice,
        finalizeBill,
        grandTotal,
        advanceAmount,
        setAdvanceAmount,
        finalBalance,
        customerName,
        setCustomerName,
        vehicleNumber,
        setVehicleNumber,
        resetGarage,
        currentBillId,
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
