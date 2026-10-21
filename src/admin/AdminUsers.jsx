import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, Power, AlertCircle, Check, Loader2, KeyRound } from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminUsers() {
  const { authFetch, adminUser } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Admin form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/admin/users');
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        setError(data.message || 'Restricted: Only the Owner can view administrators');
      }
    } catch (err) {
      setError('Failed to fetch administrator directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await authFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Administrator "${email}" created successfully.`);
        setName('');
        setEmail('');
        setPassword('');
        fetchAdmins();
      } else {
        setError(data.message || 'Failed to create administrator');
      }
    } catch (err) {
      setError('Network failure adding administrator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus, userEmail) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to change status of ${userEmail} to ${nextStatus}?`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`User status updated to ${nextStatus}.`);
        fetchAdmins();
      } else {
        alert(data.message || 'Failed to update user status');
      }
    } catch (err) {
      alert('Status modification failed');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className={`pb-6 border-b ${isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'}`}>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
          Access Control & Governance
        </span>
        <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
          isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
        }`}>
          Multi-Administrator Directory
        </h2>
        <p className={`text-xs mt-1 font-light ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
          Manage Owner and Admin accounts. Only authenticated Owners can provision or deactivate credentials.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-200 text-xs rounded-xs flex items-center space-x-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs rounded-xs flex items-center space-x-2">
          <Check size={15} />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Provision Admin Form */}
        <div className={`border p-6 rounded-xs shadow-lg space-y-4 h-fit ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <h3 className={`font-serif text-lg font-medium flex items-center space-x-2 ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            <UserPlus size={16} className="text-[#B49A62]" />
            <span>Add Business Partner / Admin</span>
          </h3>

          <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Partner Name"
                className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@aarkiscollection.com"
                className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Initial Password * (Min 8 chars)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Privilege Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-2.5 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              >
                <option value="admin">Administrator (Orders, Catalog, Coupons)</option>
                <option value="owner">Owner (Full Governance & User Provisioning)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center justify-center space-x-1 shadow-sm transition-colors"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <KeyRound size={14} />
                  <span>Provision Admin Account</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Administrators List */}
        <div className={`lg:col-span-2 border p-6 rounded-xs shadow-lg space-y-4 ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <h3 className={`font-serif text-lg font-medium flex items-center space-x-2 ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            <Shield size={16} className="text-[#B49A62]" />
            <span>Authorized Accounts ({users.length})</span>
          </h3>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69483]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
              Loading administrators...
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-[#2E241E]' : 'divide-[#EDE5D8]'}`}>
              {users.map((u) => {
                const isSelf = adminUser?.id === u._id;
                return (
                  <div key={u._id} className="py-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                          {u.name}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.5 bg-[#B49A62]/20 text-[#B49A62] border border-[#B49A62]/40 text-[9px] rounded-xs font-semibold">
                            YOU
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                          u.role === 'owner' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8E7766]' : 'text-[#6F5847]'}`}>{u.email}</p>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
                        Status: <strong className={u.status === 'active' ? 'text-emerald-500' : 'text-rose-500'}>{u.status}</strong>
                        {u.lastLogin && ` | Last Active: ${new Date(u.lastLogin).toLocaleDateString()}`}
                      </p>
                    </div>

                    {!isSelf && (
                      <button
                        onClick={() => handleToggleStatus(u._id, u.status, u.email)}
                        className={`px-3 py-1 text-xs rounded-xs border flex items-center space-x-1 ${
                          u.status === 'active' 
                            ? 'bg-rose-950/60 hover:bg-rose-900 border-rose-800 text-rose-300' 
                            : 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-300'
                        }`}
                      >
                        <Power size={12} />
                        <span>{u.status === 'active' ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
