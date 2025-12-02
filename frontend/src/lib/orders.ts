import { Item } from './api';

export interface OrderItem {
  item: Item;
  quantity: number;
}

export interface Order {
  orderId: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  date: string;
  shippingAddress?: string;
  paymentMethod?: string;
}

const ORDERS_STORAGE_KEY = 'campus_rehome_orders';

export function saveOrder(order: Omit<Order, 'orderId' | 'date'>): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date: new Date().toISOString(),
  };
  
  orders.push(newOrder);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  return newOrder;
}

export function getOrders(): Order[] {
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getOrdersByCustomer(email: string): Order[] {
  const orders = getOrders();
  return orders
    .filter((order) => order.customerEmail === email)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function removeOrder(orderId: string): void {
  const orders = getOrders();
  const filtered = orders.filter(order => order.orderId !== orderId);
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(filtered));
}



