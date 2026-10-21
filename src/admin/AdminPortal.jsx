import React, { useState } from 'react';
import { 
  LayoutDashboard, ShoppingBag, Layers, FolderTree, Tag, 
  Users, LogOut, ExternalLink, Sparkles, Menu, X, Sun, Moon 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminProducts from './AdminProducts';
import AdminCategories from './AdminCategories';
import AdminCoupons from './AdminCoupons';
import AdminUsers from './AdminUsers';

export default function AdminPortal() {
  const { adminUser, logout } = useAdminAuth();
  const { isDark, toggleTheme } = useAdminTheme();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [orderFilter, setOrderFilter] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (tab, filter = 'all') => {
    setCurrentTab(tab);
    if (tab === 'orders' && filter) {
      setOrderFilter(filter);
    }
  };

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
    <div className={`min-h-screen flex flex-col md:flex-row transition-colors duration-200 ${
      isDark ? 'bg-[#181311] text-[#EFEAE2]' : 'bg-[#F4EFEB] text-[#2C211B]'
    }`}>
      
      {/* Mobile Top Bar */}
      <div className={`md:hidden flex items-center justify-between p-4 border-b ${
        isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-[#FAF7F2] border-[#E5DDD0]'
      }`}>
        <div className="flex items-center space-x-2">
          <Sparkles size={16} className="text-[#B49A62]" />
          <span className={`font-serif text-lg font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
            Aarkis Atelier Admin
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xs border transition-colors ${
              isDark 
                ? 'bg-[#181311] border-[#3E322A] text-amber-400 hover:text-amber-300' 
                : 'bg-white border-[#E0D7C9] text-amber-600 hover:text-amber-700'
            }`}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 ${isDark ? 'text-[#C8B8A6] hover:text-white' : 'text-[#6F5847] hover:text-black'}`}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 border-r flex flex-col justify-between
        transform transition-transform duration-200 ease-in-out md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-[#FAF7F2] border-[#E5DDD0] shadow-sm'}
      `}>
        <div>
          {/* Brand Header */}
          <div className={`p-6 border-b flex items-center justify-between ${
            isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
          }`}>
            <div className="flex items-center space-x-2.5">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                isDark ? 'bg-[#181311] border-[#B49A62]/30' : 'bg-white border-[#B49A62]/50'
              }`}>
                <Sparkles size={14} className="text-[#B49A62]" />
              </div>
              <div>
                <h1 className={`font-serif text-lg font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                  Aarkis Collection
                </h1>
                <p className="text-[10px] uppercase tracking-widest text-[#B49A62]">
                  Atelier Control Center
                </p>
              </div>
            </div>

            {/* Desktop Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-xs border transition-colors ${
                isDark 
                  ? 'bg-[#181311] border-[#3E322A] text-amber-400 hover:text-amber-300' 
                  : 'bg-white border-[#E0D7C9] text-amber-600 hover:text-amber-700 shadow-xs'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
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
                      : isDark
                        ? 'text-[#C8B8A6] hover:bg-[#2E241E] hover:text-white'
                        : 'text-[#6F5847] hover:bg-[#EDE5D8] hover:text-[#281D18]'
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
        <div className={`p-4 border-t space-y-3 ${
          isDark ? 'border-[#342922] bg-[#1C1613]' : 'border-[#E8E0D2] bg-[#F3EDE2]'
        }`}>
          <div className="px-2">
            <p className={`text-xs font-semibold truncate ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
              {adminUser?.name}
            </p>
            <p className={`text-[10px] truncate ${isDark ? 'text-[#8E7766]' : 'text-[#857062]'}`}>
              {adminUser?.email}
            </p>
            <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#B49A62]/20 text-[#B49A62] text-[9px] uppercase tracking-wider rounded-xs font-bold">
              {adminUser?.role}
            </span>
          </div>

          <div className={`pt-2 border-t flex items-center justify-between ${
            isDark ? 'border-[#2E241E]' : 'border-[#E2D8C9]'
          }`}>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`text-[11px] flex items-center space-x-1 ${
                isDark ? 'text-[#A69483] hover:text-[#FAF7F2]' : 'text-[#6F5847] hover:text-[#181311]'
              }`}
            >
              <ExternalLink size={12} />
              <span>View Storefront</span>
            </a>
            <button
              onClick={logout}
              className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center space-x-1 p-1"
              title="Logout session"
            >
              <LogOut size={12} />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className={`flex-1 min-h-screen p-4 sm:p-6 lg:p-10 overflow-y-auto transition-colors duration-200 ${
        isDark ? 'bg-[#181311]' : 'bg-[#FAF7F2]'
      }`}>
        <div className="max-w-7xl mx-auto">
          {currentTab === 'dashboard' && <AdminDashboard onNavigate={handleNavigate} />}
          {currentTab === 'orders' && <AdminOrders initialStatusFilter={orderFilter} onStatusFilterChange={setOrderFilter} />}
          {currentTab === 'products' && <AdminProducts />}
          {currentTab === 'categories' && <AdminCategories />}
          {currentTab === 'coupons' && <AdminCoupons />}
          {currentTab === 'users' && <AdminUsers />}
        </div>
      </main>

    </div>
  );
}
