import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopProvider, useShop } from '../context/ShopContext';
import CartDrawer from '../components/CartDrawer';
import CustomerAccountModal from '../components/CustomerAccountModal';
import WishlistDrawer from '../components/WishlistDrawer';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductCard from '../components/ProductCard';
import { PRODUCTS } from '../data/products';

function DummyConsumer() {
  const { isCartOpen, setIsCartOpen, setIsAccountOpen } = useShop();
  return (
    <div>
      <button onClick={() => setIsCartOpen(true)}>Open Bag</button>
      <button onClick={() => setIsAccountOpen(true)}>Open Account</button>
    </div>
  );
}

describe('Aarkis Collection Frontend Component Tests', () => {
  it('renders shop context and opens customer account modal', () => {
    render(
      <ShopProvider>
        <DummyConsumer />
        <CustomerAccountModal />
      </ShopProvider>
    );

    expect(screen.queryByText(/Sign In with Phone/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Open Account'));
    expect(screen.getByText(/Sign In with Phone/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('+91 98765 43210')).toBeInTheDocument();
  });

  it('renders cart drawer and displays empty state correctly', () => {
    render(
      <ShopProvider>
        <DummyConsumer />
        <CartDrawer />
      </ShopProvider>
    );

    fireEvent.click(screen.getByText('Open Bag'));
    expect(screen.getByText(/Your bag is empty/i)).toBeInTheDocument();
  });

  it('renders wishlist drawer and opens properly upon trigger', () => {
    function WishlistConsumer() {
      const { setIsWishlistOpen } = useShop();
      return <button onClick={() => setIsWishlistOpen(true)}>Open Wishlist</button>;
    }
    render(
      <ShopProvider>
        <WishlistConsumer />
        <WishlistDrawer />
      </ShopProvider>
    );

    fireEvent.click(screen.getByText('Open Wishlist'));
    expect(screen.getByText(/Atelier Wishlist/i)).toBeInTheDocument();
  });

  it('opens ProductDetailModal when product card is clicked', () => {
    render(
      <ShopProvider>
        <ProductCard product={PRODUCTS[0]} />
        <ProductDetailModal />
      </ShopProvider>
    );

    expect(screen.queryByText('Garment Highlights')).not.toBeInTheDocument();
    
    // Click on Quick Atelier View button
    const quickViewBtn = screen.getByText('Quick Atelier View');
    fireEvent.click(quickViewBtn);

    // Verify modal elements are rendered
    expect(screen.getByText('Garment Highlights')).toBeInTheDocument();
    expect(screen.getByText('Add to Shopping Bag')).toBeInTheDocument();
  });
});
