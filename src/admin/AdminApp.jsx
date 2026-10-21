import React from 'react';
import { AdminAuthProvider, useAdminAuth } from './AdminAuthContext';
import { AdminThemeProvider } from './AdminThemeContext';
import AdminLogin from './AdminLogin';
import AdminPortal from './AdminPortal';
import { Loader2 } from 'lucide-react';

function AdminContent() {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#181311] flex flex-col items-center justify-center text-[#B49A62]">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-[#A69483]">
          Validating Security Credentials...
        </p>
      </div>
    );
  }

  return isAuthenticated ? <AdminPortal /> : <AdminLogin />;
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        <AdminContent />
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}
