import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  // Cart state persisted in localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aarkis_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state persisted in localStorage
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('aarkis_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic products and categories from backend API with fallback
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Drawer / Modal states
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [customer, setCustomer] = useState(() => {
    try {
      const saved = localStorage.getItem('aarkis_customer_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [selectedVariantColor, setSelectedVariantColor] = useState(null);
  const [comingSoonCategory, setComingSoonCategory] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch / refresh catalog from backend API with automatic synchronization
  const refreshCatalog = async (silent = true) => {
    try {
      if (!silent) setIsLoadingCatalog(true);
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products?_t=' + Date.now()).catch(() => null),
        fetch('/api/categories?_t=' + Date.now()).catch(() => null)
      ]);

      if (pRes && pRes.ok) {
        const pData = await pRes.json();
        if (pData.success && Array.isArray(pData.products) && pData.products.length > 0) {
          const mapped = pData.products.map(p => ({
            ...p,
            id: p.slug || p._id || p.id,
            dbId: p._id
          }));
          setProducts(mapped);

          // Keep selectedProductForModal updated if it is currently open
          setSelectedProductForModal(prev => {
            if (!prev) return prev;
            const updated = mapped.find(m => m.id === prev.id || m._id === prev._id);
            return updated || prev;
          });
        }
      }

      if (cRes && cRes.ok) {
        const cData = await cRes.json();
        if (cData.success && Array.isArray(cData.categories)) {
          setCategories(cData.categories);
        }
      }
    } catch (err) {
      console.warn('Backend catalog sync fallback to local preset:', err);
    } finally {
      if (!silent) setIsLoadingCatalog(false);
    }
  };

  useEffect(() => {
    refreshCatalog(false);

    // Auto-sync every 4.5 seconds so stock changes reflect automatically in real-time
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshCatalog(true);
      }
    }, 4500);

    const handleFocus = () => refreshCatalog(true);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        refreshCatalog(true);
      }
    };
    const handleStorage = (e) => {
      if (e.key === 'aarkis_catalog_sync') {
        refreshCatalog(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aarkis_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('aarkis_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.error(e);
    }
  }, [wishlist]);

  // Toast notification
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Add to cart with inventory limit check
  const addToCart = (product, variant, size) => {
    if (product?.isComingSoon) {
      showToast('This creation is currently coming soon and not yet available for purchase.');
      return;
    }

    const activeVariant = variant || product.variants[0];
    const chosenSize = size || 'M';

    // Case-insensitive size key lookup
    const sizeKey = Object.keys(activeVariant?.inventory || {}).find(
      k => k.trim().toUpperCase() === (chosenSize || '').trim().toUpperCase()
    ) || chosenSize;

    const rawStock = activeVariant?.inventory?.[sizeKey];
    const maxStock = (rawStock !== undefined && rawStock !== null)
      ? Number(rawStock)
      : (activeVariant?.inventory && Object.keys(activeVariant.inventory).length > 0 ? 0 : 5);

    if (maxStock <= 0) {
      showToast(`Size ${chosenSize} for this creation is currently out of stock.`);
      return;
    }

    const cartItemId = `${product.id}-${activeVariant.id}-${chosenSize}`;

    let isAtLimit = false;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        if (existing.quantity >= maxStock) {
          isAtLimit = true;
          return prev;
        }
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1, maxStock }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          shortName: product.shortName || product.name,
          category: product.category,
          price: product.price,
          priceDisplay: product.priceDisplay,
          colorId: activeVariant.id,
          colorName: activeVariant.name || activeVariant.colorName,
          colorHex: activeVariant.colorHex,
          image: activeVariant.image,
          size: chosenSize,
          quantity: 1,
          maxStock,
        },
      ];
    });

    if (isAtLimit) {
      showToast(`Maximum atelier inventory reached (${maxStock} ${maxStock === 1 ? 'piece' : 'pieces'} available).`);
    } else {
      showToast(`Added ${product.shortName || product.name} (${activeVariant.name || activeVariant.colorName}, Size ${chosenSize}) to Bag`);
      setIsCartOpen(true);
    }
  };

  const updateQuantity = (cartItemId, delta) => {
    let limitReached = false;
    let limitCount = 0;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const maxStock = item.maxStock !== undefined ? item.maxStock : 99;
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > maxStock) {
              limitReached = true;
              limitCount = maxStock;
              return { ...item, quantity: maxStock };
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );

    if (limitReached) {
      showToast(`Only ${limitCount} ${limitCount === 1 ? 'piece is' : 'pieces are'} available in stock.`);
    }
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    showToast('Item removed from shopping bag');
  };

  const updateCartItemVariant = (cartItemId, newVariant, newSize) => {
    setCart((prev) => {
      const item = prev.find((i) => i.cartItemId === cartItemId);
      if (!item) return prev;

      const v = newVariant || { id: item.colorId, name: item.colorName, colorHex: item.colorHex, image: item.image };
      const s = newSize || item.size;
      const newCartItemId = `${item.productId}-${v.id}-${s}`;

      const sizeKey = Object.keys(v.inventory || {}).find(
        (k) => k.trim().toUpperCase() === s.trim().toUpperCase()
      ) || s;
      const rawStock = v.inventory?.[sizeKey];
      const maxStock = (rawStock !== undefined && rawStock !== null) ? Number(rawStock) : 10;

      if (maxStock <= 0) {
        showToast(`Size ${s} in ${v.name || v.colorName} is currently out of stock.`);
        return prev;
      }

      // If item with new combination already exists in cart, merge quantities
      const existingOther = prev.find((i) => i.cartItemId === newCartItemId && i.cartItemId !== cartItemId);
      if (existingOther) {
        const mergedQty = Math.min(maxStock, existingOther.quantity + item.quantity);
        return prev
          .filter((i) => i.cartItemId !== cartItemId)
          .map((i) => (i.cartItemId === newCartItemId ? { ...i, quantity: mergedQty, maxStock } : i));
      }

      return prev.map((i) => {
        if (i.cartItemId === cartItemId) {
          return {
            ...i,
            cartItemId: newCartItemId,
            colorId: v.id,
            colorName: v.name || v.colorName,
            colorHex: v.colorHex,
            image: v.image,
            size: s,
            maxStock,
            quantity: Math.min(i.quantity, maxStock || 1),
          };
        }
        return i;
      });
    });
    showToast('Updated garment specifications in bag');
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast('Removed from your wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Saved to your wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const openProductModal = (product, colorVariant = null) => {
    setSelectedProductForModal(product);
    setSelectedVariantColor(colorVariant || product?.variants?.[0] || null);
  };

  const closeProductModal = () => {
    setSelectedProductForModal(null);
    setSelectedVariantColor(null);
  };

  const openComingSoon = (categoryName) => {
    setComingSoonCategory(categoryName);
  };

  const closeComingSoon = () => {
    setComingSoonCategory(null);
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        categories,
        isLoadingCatalog,
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        updateQuantity,
        removeFromCart,
        updateCartItemVariant,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        isWishlistOpen,
        setIsWishlistOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isSearchOpen,
        setIsSearchOpen,
        isAccountOpen,
        setIsAccountOpen,
        customer,
        setCustomer,
        searchQuery,
        setSearchQuery,
        activeCategoryFilter,
        setActiveCategoryFilter,
        selectedProductForModal,
        selectedVariantColor,
        setSelectedVariantColor,
        openProductModal,
        closeProductModal,
        comingSoonCategory,
        openComingSoon,
        closeComingSoon,
        isSizeGuideOpen,
        setIsSizeGuideOpen,
        toast,
        showToast,
        refreshCatalog,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
