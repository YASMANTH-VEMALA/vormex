import apiClient from './client';

export interface StoreItem {
  id: string;
  slug: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category: string;
  type: string;
  xpCost: number;
  isFeatured?: boolean;
  metadata?: Record<string, unknown>;
  isActive: boolean;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StoreCategoryCount {
  category: string;
  count: number;
}

export interface StorePurchase {
  id: string;
  userId: string;
  itemId: string;
  item: StoreItem;
  xpSpent: number;
  purchasedAt: string;
}

export interface UserInventory {
  id: string;
  userId: string;
  itemType: string;
  itemSlug: string;
  isEquipped: boolean;
  acquiredAt: string;
  item?: StoreItem;
}

// Get all store items
export const getStoreItems = async (category?: string): Promise<StoreItem[]> => {
  const response = await apiClient.get('/store/items', { params: { category } });
  return response.data;
};

// Get store item by slug
export const getStoreItem = async (slug: string): Promise<StoreItem> => {
  const response = await apiClient.get(`/store/items/${slug}`);
  return response.data;
};

// Get store categories
export const getStoreCategories = async (): Promise<StoreCategoryCount[]> => {
  const response = await apiClient.get('/store/categories');
  return response.data;
};

// Purchase an item
export const purchaseItem = async (itemSlug: string) => {
  const response = await apiClient.post('/store/purchase', { itemSlug });
  return response;
};

// Get my inventory
export const getMyInventory = async (): Promise<UserInventory[]> => {
  const response = await apiClient.get('/store/inventory');
  // Ensure we always return an array, even if backend returns null/undefined
  return Array.isArray(response.data) ? response.data : [];
};

// Get my purchase history
export const getMyPurchases = async (): Promise<StorePurchase[]> => {
  const response = await apiClient.get('/store/history');
  return response.data;
};

// Activate an item
export const activateItem = async (inventoryId: string) => {
  const response = await apiClient.post(`/store/inventory/${inventoryId}/activate`);
  return response;
};

// Get my XP balance
export const getXPBalance = async (): Promise<number> => {
  const response = await apiClient.get('/store/balance');
  if (typeof response === 'number') return response;
  return (response as { balance?: number })?.balance ?? 0;
};

// Get purchase history
export const getPurchaseHistory = async (): Promise<StorePurchase[]> => {
  const response = await apiClient.get('/store/purchases');
  return response.data;
};
