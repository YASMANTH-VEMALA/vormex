'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Star, 
  Coins, 
  Package, 
  Check, 
  ChevronLeft,
  Crown,
  Palette,
  Zap,
  Gift,
  Clock,
  ShoppingCart,
  X,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import * as storeAPI from '@/lib/api/store';

type StoreItem = storeAPI.StoreItem;
type StorePurchase = storeAPI.StorePurchase;
type InventoryItem = storeAPI.UserInventory;

const CATEGORY_ORDER = ['chat_customization', 'theme', 'frame', 'effect', 'badge', 'donation'];

const categoryIcons: Record<string, React.ReactNode> = {
  all: <ShoppingBag className="w-4 h-4" />,
  chat_customization: <MessageCircle className="w-4 h-4" />,
  theme: <Palette className="w-4 h-4" />,
  frame: <Crown className="w-4 h-4" />,
  effect: <Zap className="w-4 h-4" />,
  badge: <Star className="w-4 h-4" />,
  donation: <Sparkles className="w-4 h-4" />,
};

function getCategoryLabel(category: string): string {
  if (category === 'chat_customization') return 'Chat Customization';
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function StorePage() {
  const [items, setItems] = useState<StoreItem[]>([]);
  const [purchases, setPurchases] = useState<StorePurchase[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [xpBalance, setXpBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory' | 'history'>('shop');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
    show: false,
    message: '',
    type: 'success'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsRes, purchasesRes, inventoryRes, balanceRes] = await Promise.all([
        storeAPI.getStoreItems(),
        storeAPI.getMyPurchases(),
        storeAPI.getMyInventory(),
        storeAPI.getXPBalance()
      ]);
      setItems(itemsRes || []);
      setPurchases(purchasesRes || []);
      setInventory(inventoryRes || []);
      setXpBalance(balanceRes || 0);
    } catch (error) {
      console.error('Error loading store data:', error);
      showToast('Failed to load store', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handlePurchase = async (item: StoreItem) => {
    const itemCost = item.xpCost;
    if (xpBalance < itemCost) {
      showToast('Not enough XP to purchase this item', 'error');
      return;
    }

    try {
      setPurchasing(item.id);
      await storeAPI.purchaseItem(item.slug ?? item.id);
      setXpBalance(prev => prev - itemCost);
      showToast(`Successfully purchased ${item.name}!`, 'success');
      setSelectedItem(null);
      loadData();
    } catch (error) {
      console.error('Error purchasing item:', error);
      showToast('Failed to purchase item', 'error');
    } finally {
      setPurchasing(null);
    }
  };

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));

    const ordered = [
      ...CATEGORY_ORDER.filter((category) => unique.includes(category)),
      ...unique.filter((category) => !CATEGORY_ORDER.includes(category)),
    ];

    return [{ id: 'all', name: 'All Items' }, ...ordered.map((category) => ({
      id: category,
      name: getCategoryLabel(category),
    }))];
  }, [items]);

  useEffect(() => {
    if (selectedCategory === 'all') return;
    if (!categories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory]);

  const filteredItems = items.filter((item) =>
    selectedCategory === 'all' ? true : item.category === selectedCategory
  );

  const getItemCost = (item: StoreItem): number => item.xpCost;

  const getInrPrice = (item: StoreItem): number | null => {
    const metadata = item.metadata as { priceInr?: unknown; currency?: unknown } | undefined;
    if (!metadata || metadata.currency !== 'INR' || typeof metadata.priceInr !== 'number') {
      return null;
    }
    return metadata.priceInr;
  };

  const getItemIcon = (type: string, category?: string) => {
    if (category === 'chat_customization') return <MessageCircle className="w-6 h-6" />;

    switch (type) {
      case 'profile_theme':
      case 'card_style':
      case 'chat_theme_pack':
        return <Palette className="w-6 h-6" />;
      case 'profile_frame':
        return <Crown className="w-6 h-6" />;
      case 'exclusive_badge':
        return <Star className="w-6 h-6" />;
      case 'name_effect':
      case 'message_effect_pack':
      case 'chat_reaction_pack':
        return <Zap className="w-6 h-6" />;
      case 'donation':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Gift className="w-6 h-6" />;
    }
  };

  const isPurchased = (itemId: string) => {
    return purchases.some(p => p.itemId === itemId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm font-medium ${
              toast.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-xl p-5 max-w-sm w-full border border-gray-200 dark:border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
                  {getItemIcon(selectedItem.type, selectedItem.category)}
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{selectedItem.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{selectedItem.description || 'No description available.'}</p>

              {getInrPrice(selectedItem) !== null && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-100/70 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300">
                  <span className="text-xs font-semibold uppercase tracking-wide">Cash Pack</span>
                  <span className="text-sm font-bold">₹{getInrPrice(selectedItem)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gray-100 dark:bg-neutral-800">
                <Coins className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{getItemCost(selectedItem).toLocaleString()} XP</span>
              </div>

              {selectedItem.stock !== undefined && selectedItem.stock !== null && (
                <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
                  <Package className="w-3.5 h-3.5" />
                  <span>{selectedItem.stock} remaining in stock</span>
                </div>
              )}

              {isPurchased(selectedItem.id) ? (
                <div className="w-full py-2.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  Already Owned
                </div>
              ) : (
                <button
                  onClick={() => handlePurchase(selectedItem)}
                  disabled={purchasing === selectedItem.id || xpBalance < getItemCost(selectedItem)}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    xpBalance >= getItemCost(selectedItem)
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                      : 'bg-gray-200 dark:bg-neutral-800 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {purchasing === selectedItem.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                      Purchasing...
                    </>
                  ) : xpBalance < getItemCost(selectedItem) ? (
                    <>
                      <Coins className="w-4 h-4" />
                      Need {(getItemCost(selectedItem) - xpBalance).toLocaleString()} more XP
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Purchase Now
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-gray-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/more" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">XP Store</h1>
                <p className="text-xs text-gray-500">Spend your earned XP</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-neutral-800">
              <Coins className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">{xpBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex px-4 gap-2 pb-3">
            {[
              { id: 'shop', label: 'Shop', icon: <ShoppingBag className="w-4 h-4" /> },
              { id: 'inventory', label: 'My Items', icon: <Package className="w-4 h-4" /> },
              { id: 'history', label: 'History', icon: <Clock className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-5">
        {activeTab === 'shop' && (
          <>
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  {categoryIcons[category.id] || <ShoppingBag className="w-4 h-4" />}
                  {category.name}
                </button>
              ))}
            </div>

            {selectedCategory === 'all' && items.some((item) => item.category === 'chat_customization') && (
              <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">New</p>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat Customization Packs</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">Animated reactions, premium themes, and message effects from ₹29</p>
                  </div>
                  <button
                    onClick={() => setSelectedCategory('chat_customization')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 transition-colors shrink-0"
                  >
                    Explore
                  </button>
                </div>
              </div>
            )}

            {/* Items Grid */}
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <ShoppingBag className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No items available</h3>
                <p className="text-xs text-gray-500">Check back later for new items</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="w-full bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800 hover:border-gray-300 dark:hover:border-neutral-700 transition-all text-left"
                    >
                      {isPurchased(item.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}

                      {getInrPrice(item) !== null && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                          ₹{getInrPrice(item)}
                        </div>
                      )}
                      
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                        {getItemIcon(item.type, item.category)}
                      </div>
                      
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description || 'No description available.'}</p>
                      
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                        <Coins className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">{getItemCost(item).toLocaleString()}</span>
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            {inventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Package className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Your inventory is empty</h3>
                <p className="text-xs text-gray-500 mb-3">Purchase items from the store to add them here</p>
                <button
                  onClick={() => setActiveTab('shop')}
                  className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                >
                  Browse Store
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {inventory.map((inv) => {
                  const item = inv.item;
                  if (!item) return null;

                  return (
                    <motion.div
                      key={inv.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-gray-200 dark:border-neutral-800"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 mb-3">
                        {getItemIcon(item.type, item.category)}
                      </div>
                      
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white mb-0.5 line-clamp-1">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.description || 'No description available.'}</p>
                      
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        inv.isEquipped
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}>
                        {inv.isEquipped ? 'Equipped' : 'Owned'}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <>
            {purchases.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                  <Clock className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">No purchase history</h3>
                <p className="text-xs text-gray-500">Your purchases will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {purchases.map((purchase) => (
                  <motion.div
                    key={purchase.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-xl p-3 border border-gray-200 dark:border-neutral-800 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-600 dark:text-gray-400 shrink-0">
                      {getItemIcon(purchase.item.type, purchase.item.category)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">{purchase.item.name}</h3>
                      <p className="text-xs text-gray-500">
                        {purchase.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Unknown date'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <Coins className="w-3.5 h-3.5" />
                      <span className="text-sm font-medium">-{purchase.xpSpent.toLocaleString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StorePageWrapper() {
  return (
    <ProtectedRoute>
      <StorePage />
    </ProtectedRoute>
  );
}
