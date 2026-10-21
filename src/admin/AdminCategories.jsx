import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Trash2, Edit2, Layers, 
  AlertCircle, Check, Loader2, Plus, X 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminCategories() {
  const { authFetch } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mode: null | 'create' | 'edit'
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await authFetch('/api/categories');
      const data = await res.json();
      if (res.ok && data.success) {
        setCategories(data.categories || []);
      }
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleStartEdit = (cat) => {
    setEditingCategoryId(cat._id);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setName('');
    setSlug('');
    setDescription('');
    setError('');
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const url = editingCategoryId ? `/api/categories/${editingCategoryId}` : '/api/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';
      const autoSlug = (slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const res = await authFetch(url, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          slug: autoSlug,
          description: description.trim()
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(editingCategoryId 
          ? `Category "${name}" updated successfully!` 
          : `Category "${name}" created successfully!`
        );
        handleCancelEdit();
        fetchCategories();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error saving category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"? This will fail if products are assigned to it.`)) {
      return;
    }

    try {
      const res = await authFetch(`/api/categories/${catId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Category "${catName}" removed.`);
        fetchCategories();
      } else {
        alert(data.message || 'Cannot delete category with assigned products.');
      }
    } catch (err) {
      alert('Delete request failed.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={`pb-6 border-b ${isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'}`}>
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
          Taxonomy
        </span>
        <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
          isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
        }`}>
          Categories Management
        </h2>
        <p className={`text-xs mt-1 font-light ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
          Create and organize foundational parent categories. Any newly added category automatically appears on the storefront.
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
        {/* Create / Edit Category Form */}
        <div className={`border p-6 rounded-xs shadow-lg space-y-4 h-fit ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-serif text-lg font-medium flex items-center space-x-2 ${
              isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
            }`}>
              {editingCategoryId ? (
                <>
                  <Edit2 size={16} className="text-[#B49A62]" />
                  <span>Edit Category</span>
                </>
              ) : (
                <>
                  <FolderPlus size={16} className="text-[#B49A62]" />
                  <span>Add New Category</span>
                </>
              )}
            </h3>
            {editingCategoryId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-[#8E7766] hover:text-[#B49A62] flex items-center space-x-1"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitCategory} className="space-y-4 text-xs">
            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Category Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Evening Pret"
                className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Editorial styling notes for this collection"
                className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                  isDark ? 'bg-[#181311] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                }`}
              />
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
                  {editingCategoryId ? <Edit2 size={14} /> : <Plus size={14} />}
                  <span>{editingCategoryId ? 'Save Category Changes' : 'Create Category'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Categories List */}
        <div className={`lg:col-span-2 border p-6 rounded-xs shadow-lg space-y-4 ${
          isDark ? 'bg-[#221B17] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
        }`}>
          <div className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
          }`}>
            <h3 className={`font-serif text-lg font-medium flex items-center space-x-2 ${
              isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
            }`}>
              <Layers size={16} className="text-[#B49A62]" />
              <span>Catalog Categories ({categories.length})</span>
            </h3>
            <span className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
              Safety Lock: Cannot delete if products linked
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69483]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
              Loading categories...
            </div>
          ) : (
            <div className={`divide-y ${isDark ? 'divide-[#2E241E]' : 'divide-[#EDE5D8]'}`}>
              {categories.map((cat) => (
                <div key={cat._id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className={`font-serif text-base font-medium mr-2 ${
                        isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
                      }`}>
                        {cat.name}
                      </span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-xs border ${
                        isDark ? 'text-[#A69483] bg-[#181311] border-[#342922]' : 'text-[#6F5847] bg-[#FAF7F2] border-[#E0D7C9]'
                      }`}>
                        {cat.slug}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-[#B49A62] hover:text-amber-500 hover:bg-[#B49A62]/10 rounded-xs transition-colors flex items-center space-x-1"
                        title="Edit category"
                      >
                        <Edit2 size={13} />
                        <span className="text-[11px] uppercase tracking-wider font-medium">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat._id, cat.name)}
                        className="text-[#8E7766] hover:text-rose-500 p-1.5 transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {cat.description && (
                    <p className={`text-xs font-light ${isDark ? 'text-[#8E7766]' : 'text-[#6F5847]'}`}>
                      {cat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
