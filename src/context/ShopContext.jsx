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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);
  const [selectedVariantColor, setSelectedVariantColor] = useState(null);
  const [comingSoonCategory, setComingSoonCategory] = useState(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch catalog from backend API on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        const [pRes, cRes] = await Promise.all([
          fetch('/api/products').catch(() => null),
          fetch('/api/categories').catch(() => null)
        ]);

        if (pRes && pRes.ok) {
          const pData = await pRes.json();
          if (pData.success && Array.isArray(pData.products) && pData.products.length > 0) {
            // Map _id to id if needed for component compatibility
            const mapped = pData.products.map(p => ({
              ...p,
              id: p.slug || p._id || p.id,
              dbId: p._id
            }));
            setProducts(mapped);
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
        setIsLoadingCatalog(false);
      }
    };

    fetchCatalog();
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

  // Add to cart
  const addToCart = (product, variant, size) => {
    const activeVariant = variant || product.variants[0];
    const cartItemId = `${product.id}-${activeVariant.id}-${size}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          shortName: product.shortName,
          category: product.category,
          price: product.price,
          priceDisplay: product.priceDisplay,
          colorId: activeVariant.id,
          colorName: activeVariant.name,
          colorHex: activeVariant.colorHex,
          image: activeVariant.image,
          size: size || 'M',
          quantity: 1,
        },
      ];
    });

    showToast(`Added ${product.shortName} (${activeVariant.name}, Size ${size || 'M'}) to Bag`);
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    showToast('Item removed from shopping bag');
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
    setSelectedVariantColor(colorVariant || product.variants[0]);
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
        clearCart,
        isCartOpen,
        setIsCartOpen,
        wishlist,
        toggleWishlist,
        isInWishlist,
        isSearchOpen,
        setIsSearchOpen,
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
