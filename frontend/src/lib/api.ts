const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Types
export interface Item {
  furniture_id: number;
  name: string;
  category?: string;
  description?: string;
  price: number;
  condition_status: 'New' | 'Like New' | 'Good' | 'Fair' | 'Poor';
  quantity: number;
  image_url?: string;
  date_added?: string;
  added_by_employee_id?: number;
}

export interface User {
  customer_id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  date_registered?: string;
  isEmployee?: boolean;
}

// Auth API
export async function register(
  email: string,
  password: string,
  first_name?: string,
  last_name?: string,
  phone?: string,
  address?: string
) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, first_name, last_name, phone, address }),
  });
}

export async function login(email: string, password: string) {
  return request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function updateProfile(
  customerId: number,
  updates: Partial<Omit<User, 'customer_id' | 'email' | 'date_registered'>>
) {
  return request<User>(`/auth/profile/${customerId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Items API
export async function getItems(): Promise<Item[]> {
  return request<Item[]>('/items');
}

export async function getItem(id: number): Promise<Item> {
  return request<Item>(`/items/${id}`);
}

export async function createItem(item: Omit<Item, 'furniture_id' | 'date_added'>): Promise<Item> {
  return request<Item>('/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export async function updateItem(
  id: number,
  updates: Partial<Omit<Item, 'furniture_id' | 'date_added'>>
): Promise<Item> {
  return request<Item>(`/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteItem(id: number): Promise<void> {
  return request<void>(`/items/${id}`, {
    method: 'DELETE',
  });
}

