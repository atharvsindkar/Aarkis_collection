import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Layers, FolderTree, Tag, 
  Users, LogOut, ExternalLink, Sparkles, Menu, X 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminCoupons from './AdminCoupons';
import AdminUsers from './AdminUsers';

export default function AdminPortal() {
  const { adminUser, logout } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders Fulfillment', icon: ShoppingBag },
    { id: 'products', label: 'Products & Variants', icon: Layers },
    { id: 'categories', label: 'Categories Taxonomy', icon: FolderTree },
    { id: 'coupons', label: 'Coupons & Vouchers', icon: Tag },
    ...(adminUser?.role === 'owner' ? [
      { id: 'users', label: 'Administrators', icon: Users }
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[#181311] text-[#EFEAE2] flex flex-col md:flex-row">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#221B17] border-b border-[#3E322A]">
        <div className="flex items-center space-x-2">
          <Sparkles size={16} className="text-[#B49A62]" />
          <span className="font-serif text-lg text-[#FAF7F2]">Aarkis Atelier Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-[#C8B8A6] hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#221B17] border-r border-[#3E322A] flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-[#342922]">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#181311] border border-[#B49A62]/30 flex items-center justify-center">
                <Sparkles size={14} className="text-[#B49A62]" />
              </div>
              <div>
                <h1 className="font-serif text-lg font-medium text-[#FAF7F2]">
                  Aarkis Collection
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-[#B49A62]">
                  Atelier Control Center
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xs text-xs uppercase tracking-wider font-medium transition-colors ${
                    isActive
                      ? 'bg-[#B49A62] text-[#181311] font-semibold shadow-md'
                      : 'text-[#C8B8A6] hover:bg-[#2E241E] hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions Footer */}
        <div className="p-4 border-t border-[#342922] space-y-3 bg-[#1C1613]">
          <div className="px-2">
            <p className="text-xs font-semibold text-[#FAF7F2] truncate">{adminUser?.name}</p>
            <p className="text-[10px] text-[#8E7766] truncate">{adminUser?.email}</p>
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#B49A62]/20 text-[#B49A62] text-[9px] uppercase tracking-wider rounded-xs font-bold">
              {adminUser?.role}
            </span>
          </div>

          <div className="pt-2 border-t border-[#2E241E] flex items-center justify-between">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#A69483] hover:text-[#FAF7F2] flex items-center space-x-1"
            >
              <ExternalLink size={12} />
              <span>View Storefront</span>
            </a>
            <button
              onClick={logout}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 p-1"
              title="Logout session"
            >
              <LogOut size={12} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-h-screen bg-[#181311] p-4 sm:p-6 lg:p-10 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {currentTab === 'dashboard' && <AdminDashboard onNavigate={setCurrentTab} />}
          {currentTab === 'orders' && <AdminOrders />}
          {currentTab === 'products' && <AdminProducts />}
          {currentTab === 'categories' && <AdminCategories />}
          {currentTab === 'coupons' && <AdminCoupons />}
          {currentTab === 'users' && <AdminUsers />}
        </div>
      </main>

    </div>
  );
}
