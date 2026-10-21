import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Connection failure. Check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181311] text-[#EFEAE2] flex items-center justify-center p-4">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#B49A62]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#221B17] border border-[#3E322A] rounded-xs shadow-2xl p-8 animate-fade-in">
        {/* Brand Crest Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#2E241E] border border-[#B49A62]/30 flex items-center justify-center mb-3">
            <Sparkles size={20} className="text-[#B49A62]" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#B49A62] font-semibold">
            Atelier Governance
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-[#FAF7F2] mt-1">
            Aarkis Collection
          </h1>
          <p className="text-xs text-[#A69483] mt-1 font-light">
            Secure administrative control portal
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xs flex items-center space-x-2">
            <ShieldAlert size={16} className="text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#C8B8A6] mb-1.5 font-medium">
              Administrator Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aarkiscollection.com"
                className="w-full px-4 py-3 bg-[#181311] border border-[#3E322A] text-xs text-[#FAF7F2] rounded-xs focus:outline-none focus:border-[#B49A62] pl-10"
              />
              <Mail size={15} className="absolute left-3.5 top-3.5 text-[#8E7766]" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-[#C8B8A6] mb-1.5 font-medium">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-[#181311] border border-[#3E322A] text-xs text-[#FAF7F2] rounded-xs focus:outline-none focus:border-[#B49A62] pl-10"
              />
              <Lock size={15} className="absolute left-3.5 top-3.5 text-[#8E7766]" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] text-xs font-semibold uppercase tracking-[0.2em] rounded-xs flex items-center justify-center space-x-2 transition-colors disabled:opacity-75 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-[#342922] text-center">
          <p className="text-[11px] text-[#7F6B5C]">
            Protected by Argon2id / Bcrypt password hashing & rate-limiting lockouts.
          </p>
          <a
            href="/"
            className="inline-block mt-3 text-[11px] uppercase tracking-wider text-[#B49A62] hover:underline"
          >
            ← Return to Public Storefront
          </a>
        </div>
      </div>
    </div>
  );
}
