import React from 'react';
import { ShopProvider } from './context/ShopContext';
import AnnouncementBar from './components/AnnouncementBar';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import BrandIntro from './components/BrandIntro';
import CategoryShowcase from './components/CategoryShowcase';
import ProductSection from './components/ProductSection';
import EditorialSection from './components/EditorialSection';
import BrandValuesStrip from './components/BrandValuesStrip';
import Newsletter from './components/Newsletter';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import CartDrawer from './components/CartDrawer';
import SearchModal from './components/SearchModal';
import ComingSoonModal from './components/ComingSoonModal';
import SizeGuideModal from './components/SizeGuideModal';
import ToastNotification from './components/ToastNotification';
import './App.css';

export default function App() {
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

          {/* Three Disciplines / Category Showcase */}
          <CategoryShowcase />

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
        <SearchModal />
        <ComingSoonModal />
        <SizeGuideModal />
        <ToastNotification />
      </div>
    </ShopProvider>
  );
}
