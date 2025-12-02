import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Item } from '../lib/api';

interface CartItem {
  item: Item;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Item, quantity?: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartItemsRef = useRef<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        setCartItems(JSON.parse(storedCart));
      } catch (e) {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Update ref whenever cartItems changes
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Item, quantity: number = 1) => {
    // Validate synchronously using current cart state
    const currentItems = cartItemsRef.current;
    const existingItem = currentItems.find((ci) => ci.item.furniture_id === item.furniture_id);
    const currentCartQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentCartQty + quantity;
    
    // Validate stock availability before updating state
    if (newTotalQty > item.quantity) {
      throw new Error(`Only ${item.quantity} ${item.quantity === 1 ? 'left in stock' : 'left in stock'} — you already have the maximum in your cart.`);
    }
    
    // Update state after validation
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((ci) => ci.item.furniture_id === item.furniture_id);
      const currentCartQty = existingItem ? existingItem.quantity : 0;
      const newTotalQty = currentCartQty + quantity;
      
      if (existingItem) {
        // If item already in cart, increase quantity
        return prevItems.map((ci) =>
          ci.item.furniture_id === item.furniture_id
            ? { ...ci, quantity: newTotalQty, item } // Update item data to latest
            : ci
        );
      } else {
        // Add new item to cart with specified quantity
        return [...prevItems, { item, quantity }];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCartItems((prevItems) => prevItems.filter((ci) => ci.item.furniture_id !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    // Validate synchronously using current cart state
    const currentItems = cartItemsRef.current;
    const cartItem = currentItems.find((ci) => ci.item.furniture_id === itemId);
    if (!cartItem) return;
    
    // Validate stock availability before updating state
    if (quantity > cartItem.item.quantity) {
      throw new Error(`Only ${cartItem.item.quantity} ${cartItem.item.quantity === 1 ? 'left in stock' : 'left in stock'} — you already have the maximum in your cart.`);
    }
    
    // Update state after validation
    setCartItems((prevItems) =>
      prevItems.map((ci) =>
        ci.item.furniture_id === itemId ? { ...ci, quantity } : ci
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, ci) => total + ci.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, ci) => total + ci.item.price * ci.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

