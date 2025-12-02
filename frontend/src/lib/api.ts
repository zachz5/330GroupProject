const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
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
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error:', error);
      throw new Error('Unable to connect to server. Please check if the backend server is running.');
    }
    throw error;
  }
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
  emoji?: string;
  date_added?: string;
  added_by_employee_id?: number;
}

export interface User {
  customer_id?: number;
  employee_id?: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  date_registered?: string;
  isEmployee?: boolean;
  role?: string;
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
  const user = await request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // Verify that the returned user's email matches what we logged in with
  if (user.email !== email) {
    throw new Error('Login returned incorrect user data');
  }
  
  return user;
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

// Upload API
export async function uploadImage(file: File): Promise<{ imageUrl: string }> {
  const formData = new FormData();
  formData.append('image', file);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const response = await fetch(`${API_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `Upload failed: ${response.status}`);
  }

  return response.json();
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

// Users/Customers API (for employees)
export interface Customer {
  customer_id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  date_registered?: string;
  is_active?: number | boolean;
}

export async function getAllCustomers(includeInactive: boolean = false): Promise<Customer[]> {
  return request<Customer[]>(`/auth/customers${includeInactive ? '?includeInactive=true' : ''}`);
}

export async function updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer> {
  return request<Customer>(`/auth/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deactivateCustomer(id: number, isActive: boolean): Promise<Customer> {
  return request<Customer>(`/auth/customers/${id}/deactivate`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });
}

// Dashboard API
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  ordersAwaitingShipment: number;
  lowStockItems: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  // TODO: Create dedicated endpoint, for now calculate from existing data
  const [customers, transactions, items] = await Promise.all([
    getAllCustomers().catch(() => []),
    getAllTransactions().catch(() => []),
    getItems().catch(() => []),
  ]);
  
  return {
    totalUsers: customers.length,
    totalOrders: transactions.length,
    ordersAwaitingShipment: transactions.filter((t: Transaction) => 
      t.status === 'Pending' || t.status === 'Processing'
    ).length,
    lowStockItems: items.filter(item => item.quantity < 5).length,
  };
}

// Transactions/Orders API (for employees)
export async function getAllTransactions(): Promise<Transaction[]> {
  return request<Transaction[]>('/transactions');
}

export async function updateTransactionStatus(
  transactionId: number,
  status: string,
  notes?: string
): Promise<Transaction> {
  return request<Transaction>(`/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify({ status, notes }),
  });
}

export async function deleteTransaction(transactionId: number): Promise<void> {
  return request<void>(`/transactions/${transactionId}`, {
    method: 'DELETE',
  });
}

// Transactions API
export interface TransactionItem {
  furniture_id: number;
  quantity: number;
  price: number;
}

export interface CreateTransactionRequest {
  customer_id: number;
  items: TransactionItem[];
  total_amount: number;
  payment_method: string;
  shipping_address?: string;
  skip_inventory_update?: boolean; // For historical order migrations
}

export interface Transaction {
  transaction_id: number;
  customer_id: number;
  transaction_date: string;
  total_amount: number;
  payment_method: string;
  status: string;
  customer_email?: string;
  first_name?: string;
  last_name?: string;
  notes?: string;
  items?: Array<{
    detail_id: number;
    transaction_id: number;
    furniture_id: number;
    quantity: number;
    price_each: number;
    name?: string;
    category?: string;
  }>;
}

export async function createTransaction(data: CreateTransactionRequest): Promise<Transaction> {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getCustomerTransactions(customerId: number): Promise<Transaction[]> {
  return request<Transaction[]>(`/transactions/customer/${customerId}`);
}

export async function getTransaction(transactionId: number): Promise<Transaction> {
  return request<Transaction>(`/transactions/${transactionId}`);
}

// Get customer_id by email
export async function getCustomerIdByEmail(email: string): Promise<number | null> {
  try {
    const response = await request<{ customer_id: number; email: string }>(`/auth/customer-by-email/${encodeURIComponent(email)}`);
    return response.customer_id;
  } catch (err) {
    console.error(`Failed to get customer_id for email ${email}:`, err);
    return null;
  }
}

// Helper function to migrate localStorage orders to database
// This function migrates ALL orders in localStorage, using the correct customer_id for each order based on customerEmail
export async function migrateLocalStorageOrders(): Promise<{ success: number; failed: number; skipped: number }> {
  const { getOrders } = await import('./orders');
  const orders = getOrders();
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  console.log(`\n🔄 Starting migration of ${orders.length} localStorage orders...\n`);
  
  for (const order of orders) {
    try {
      // Validate order data
      if (!order.items || order.items.length === 0) {
        console.warn(`⚠️ Skipping order ${order.orderId}: No items`);
        failed++;
        continue;
      }
      
      // Check if all items have valid furniture_id
      const invalidItems = order.items.filter(item => !item.item || !item.item.furniture_id);
      if (invalidItems.length > 0) {
        console.warn(`⚠️ Skipping order ${order.orderId}: Invalid items (missing furniture_id)`);
        failed++;
        continue;
      }
      
      // Get the correct customer_id for this order based on customerEmail
      if (!order.customerEmail) {
        console.warn(`⚠️ Skipping order ${order.orderId}: No customerEmail`);
        failed++;
        continue;
      }
      
      const customerId = await getCustomerIdByEmail(order.customerEmail);
      if (!customerId) {
        console.warn(`⚠️ Skipping order ${order.orderId}: Customer not found for email ${order.customerEmail}`);
        failed++;
        continue;
      }
      
      // Check if this order might already be migrated (by checking for transactions with same total and item count)
      // Note: We match by total and item count only, not by date, since migrated orders get a new transaction_date
      try {
        const existingTransactions = await getCustomerTransactions(customerId);
        const orderItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        const orderItemIds = order.items.map(item => `${item.item.furniture_id}:${item.quantity}`).sort().join(',');
        
        const matchingTransaction = existingTransactions.find(t => {
          const tItemCount = t.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
          const tItemIds = t.items?.map((item: any) => `${item.furniture_id}:${item.quantity}`).sort().join(',') || '';
          
          // Match if: same total amount, same item count, and same items (furniture_id:quantity pairs)
          return Math.abs(t.total_amount - order.total) < 0.01 && 
                 tItemCount === orderItemCount &&
                 tItemIds === orderItemIds;
        });
        
        if (matchingTransaction) {
          console.log(`⏭️  Skipping order ${order.orderId}: Already exists as transaction ${matchingTransaction.transaction_id} (same total: $${order.total}, same items)`);
          skipped++;
          continue;
        }
      } catch (err) {
        // If we can't check, proceed anyway
        console.log(`   (Could not check for duplicates, proceeding...)`);
      }
      
      console.log(`🔄 Migrating order ${order.orderId} for customer ${customerId} (${order.customerEmail})...`);
      console.log(`   Items: ${order.items.length}, Total: $${order.total}, Date: ${order.date}`);
      
      const transaction = await createTransaction({
        customer_id: customerId,
        items: order.items.map(orderItem => ({
          furniture_id: orderItem.item.furniture_id,
          quantity: orderItem.quantity,
          price: orderItem.item.price,
        })),
        total_amount: order.total,
        payment_method: order.paymentMethod || 'Credit Card',
        shipping_address: order.shippingAddress,
        skip_inventory_update: true, // Skip inventory update for historical orders
      });
      
      console.log(`✅ Successfully migrated order ${order.orderId} to transaction ${transaction.transaction_id} for customer ${customerId}\n`);
      success++;
    } catch (err) {
      console.error(`❌ Failed to migrate order ${order.orderId}:`, err);
      console.error('Order data:', JSON.stringify(order, null, 2));
      failed++;
    }
  }
  
  console.log(`\n📊 Migration complete: ${success} succeeded, ${failed} failed, ${skipped} skipped`);
  return { success, failed, skipped };
}

