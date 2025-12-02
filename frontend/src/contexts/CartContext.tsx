import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Item } from '../lib/api';
import { useAuth } from './AuthContext';

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
  mergeGuestCartIntoUserCart: () => void;
  saveUserCartToGuestCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper functions for localStorage keys
const getGuestCartKey = () => 'cart';
const getUserCartKey = (customerId: number) => `cart_user_${customerId}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const cartItemsRef = useRef<CartItem[]>([]);
  const isInitialLoadRef = useRef(true);

  // Load cart from localStorage on initial mount
  useEffect(() => {
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      const cartKey = user?.customer_id ? getUserCartKey(user.customer_id) : getGuestCartKey();
      const storedCart = localStorage.getItem(cartKey);
      if (storedCart) {
        try {
          setCartItems(JSON.parse(storedCart));
        } catch (e) {
          localStorage.removeItem(cartKey);
        }
      }
    }
  }, []);

  // Track previous user state to detect login/logout
  const prevUserRef = useRef<User | null>(null);

  // Switch cart when user logs in/out
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      const prevUser = prevUserRef.current;
      const currentUser = user;

      // User just logged in (was null/guest, now has customer_id)
      if (!prevUser?.customer_id && currentUser?.customer_id) {
        // Merge guest cart into user cart
        const guestCartKey = getGuestCartKey();
        const userCartKey = getUserCartKey(currentUser.customer_id);
        
        const guestCartStr = localStorage.getItem(guestCartKey);
        const guestCart: CartItem[] = guestCartStr ? JSON.parse(guestCartStr) : [];
        
        const userCartStr = localStorage.getItem(userCartKey);
        const userCart: CartItem[] = userCartStr ? JSON.parse(userCartStr) : [];
        
        // Merge carts: if same item exists, add quantities together
        const mergedCart: CartItem[] = [...userCart];
        
        guestCart.forEach((guestItem) => {
          const existingIndex = mergedCart.findIndex(
            (ci) => ci.item.furniture_id === guestItem.item.furniture_id
          );
          
          if (existingIndex >= 0) {
            // Item exists in user cart, add quantities together
            mergedCart[existingIndex].quantity += guestItem.quantity;
            // Update item data to latest
            mergedCart[existingIndex].item = guestItem.item;
          } else {
            // New item, add it
            mergedCart.push(guestItem);
          }
        });
        
        // Save merged cart to user cart
        localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
        setCartItems(mergedCart);
        
        // Clear guest cart
        localStorage.removeItem(guestCartKey);
      }
      // User just logged out (had customer_id, now null/guest)
      else if (prevUser?.customer_id && !currentUser?.customer_id) {
        // Save user cart to guest cart
        const userCartKey = getUserCartKey(prevUser.customer_id);
        const guestCartKey = getGuestCartKey();
        
        const userCartStr = localStorage.getItem(userCartKey);
        if (userCartStr) {
          localStorage.setItem(guestCartKey, userCartStr);
          setCartItems(JSON.parse(userCartStr));
        } else {
          localStorage.removeItem(guestCartKey);
          setCartItems([]);
        }
        
        // Clear user cart
        localStorage.removeItem(userCartKey);
      }
      // User state changed but still logged in (different user?) or still guest
      else {
        const cartKey = currentUser?.customer_id ? getUserCartKey(currentUser.customer_id) : getGuestCartKey();
        const storedCart = localStorage.getItem(cartKey);
        if (storedCart) {
          try {
            setCartItems(JSON.parse(storedCart));
          } catch (e) {
            localStorage.removeItem(cartKey);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }

      prevUserRef.current = currentUser;
    }
  }, [user?.customer_id]);

  // Update ref whenever cartItems changes
  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isInitialLoadRef.current) {
      const cartKey = user?.customer_id ? getUserCartKey(user.customer_id) : getGuestCartKey();
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    }
  }, [cartItems, user?.customer_id]);

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

  // Merge guest cart into user cart (called on login)
  const mergeGuestCartIntoUserCart = () => {
    if (!user?.customer_id) return;

    const guestCartKey = getGuestCartKey();
    const userCartKey = getUserCartKey(user.customer_id);
    
    // Get guest cart
    const guestCartStr = localStorage.getItem(guestCartKey);
    const guestCart: CartItem[] = guestCartStr ? JSON.parse(guestCartStr) : [];
    
    // Get user cart
    const userCartStr = localStorage.getItem(userCartKey);
    const userCart: CartItem[] = userCartStr ? JSON.parse(userCartStr) : [];
    
    // Merge carts: if same item exists, add quantities together
    const mergedCart: CartItem[] = [...userCart];
    
    guestCart.forEach((guestItem) => {
      const existingIndex = mergedCart.findIndex(
        (ci) => ci.item.furniture_id === guestItem.item.furniture_id
      );
      
      if (existingIndex >= 0) {
        // Item exists in user cart, add quantities together
        mergedCart[existingIndex].quantity += guestItem.quantity;
        // Update item data to latest
        mergedCart[existingIndex].item = guestItem.item;
      } else {
        // New item, add it
        mergedCart.push(guestItem);
      }
    });
    
    // Save merged cart to user cart
    localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
    setCartItems(mergedCart);
    
    // Clear guest cart
    localStorage.removeItem(guestCartKey);
  };

  // Save user cart to guest cart (called on logout)
  const saveUserCartToGuestCart = () => {
    if (!user?.customer_id) return;

    const userCartKey = getUserCartKey(user.customer_id);
    const guestCartKey = getGuestCartKey();
    
    // Get user cart
    const userCartStr = localStorage.getItem(userCartKey);
    if (userCartStr) {
      // Save to guest cart
      localStorage.setItem(guestCartKey, userCartStr);
      // Update state to show guest cart
      setCartItems(JSON.parse(userCartStr));
    } else {
      // No user cart, clear guest cart
      localStorage.removeItem(guestCartKey);
      setCartItems([]);
    }
    
    // Clear user cart
    localStorage.removeItem(userCartKey);
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
        mergeGuestCartIntoUserCart,
        saveUserCartToGuestCart,
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

