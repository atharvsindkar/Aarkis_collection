import React, { useState, useEffect } from 'react';
import { ShopProvider } from './context/ShopContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrandIntro from './components/BrandIntro';
import NewArrivalsSection from './components/NewArrivalsSection';
import ProductSection from './components/ProductSection';
import EditorialSection from './components/EditorialSection';
import BrandValuesStrip from './components/BrandValuesStrip';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import SearchModal from './components/SearchModal';
import ComingSoonModal from './components/ComingSoonModal';
import SizeGuideModal from './components/SizeGuideModal';
import ToastNotification from './components/ToastNotification';
import CustomerAccountModal from './components/CustomerAccountModal';
import AdminApp from './admin/AdminApp';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Atelier UI Error Boundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center text-xs text-[#8E7766]">
          <p>An unexpected display error occurred. Please refresh the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const isDedicatedAdminHost = typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
  
  const [isAdminRoute, setIsAdminRoute] = useState(
    isDedicatedAdminHost || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'))
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(
        isDedicatedAdminHost || window.location.pathname.startsWith('/admin')
      );
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDedicatedAdminHost]);

  if (isAdminRoute) {
    return <AdminApp />;
  }

  return (
    <ShopProvider>
      <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#2C211B] selection:bg-[#D8C2A0]/40">
        {/* Top Understated Announcement Bar */}
        <AnnouncementBar />

        {/* Premium Sticky Navigation Header */}
        <Navbar />

        {/* Main Fashion Editorial Experience */}
        <main className="flex-grow">
          {/* Hero Section */}
          <Hero />

          {/* Editorial Brand Introduction */}
          <BrandIntro />

          {/* New Arrivals Section (Replaced Three Disciplines) */}
          <NewArrivalsSection />

          {/* The Curated Edit — 3 Unique Garments with Color Variants */}
          <ProductSection />

          {/* Editorial Campaign Section */}
          <EditorialSection />

          {/* Thoughtful Service & Brand Positioning Strip */}
          <BrandValuesStrip />

          {/* Letters from Aarkis / Newsletter */}
          <Newsletter />
        </main>

        {/* Complete Atelier Footer */}
        <Footer />

        {/* Interactive Modals & Drawers */}
        <ProductDetailModal />
        <CartDrawer />
        <WishlistDrawer />
        <SearchModal />
        <ComingSoonModal />
        <SizeGuideModal />
        <CustomerAccountModal />
        <ToastNotification />
      </div>
    </ShopProvider>
  );
}
