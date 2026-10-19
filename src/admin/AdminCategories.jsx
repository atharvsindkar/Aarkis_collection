import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Trash2, Edit2, ChevronRight, Layers, 
  AlertCircle, Check, Loader2, Plus 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminCategories() {
  const { authFetch } = useAdminAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Category Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [subCategoriesInput, setSubCategoriesInput] = useState(''); // comma-separated
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const subCats = subCategoriesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await authFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          subCategories: subCats
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Category "${name}" created successfully.`);
        setName('');
        setSlug('');
        setDescription('');
        setSubCategoriesInput('');
        fetchCategories();
      } else {
        setError(data.message || 'Failed to create category');
      }
    } catch (err) {
      setError('Network error creating category');
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
      <div className="pb-6 border-b border-[#342922]">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
          Taxonomy & Hierarchy
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-normal">
          Categories & Subcategory Levels
        </h2>
        <p className="text-xs text-[#A69483] mt-1 font-light">
          Structure multi-level categories (up to 4 levels) with product deletion safety locks.
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
        {/* Create Category Form */}
        <div className="bg-[#221B17] border border-[#3E322A] p-6 rounded-xs shadow-lg space-y-4 h-fit">
          <h3 className="font-serif text-lg text-[#FAF7F2] font-medium flex items-center space-x-2">
            <FolderPlus size={16} className="text-[#B49A62]" />
            <span>Add New Category</span>
          </h3>

          <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Category Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                placeholder="e.g. Evening Pret"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Slug URL Identifier</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. evening-pret"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] font-mono text-[11px] text-[#C8B8A6] rounded-xs focus:outline-none focus:border-[#B49A62]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Editorial styling notes for this capsule collection"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#A69483] mb-1">
                Subcategories (Comma separated, up to 4 levels)
              </label>
              <textarea
                rows={3}
                value={subCategoriesInput}
                onChange={(e) => setSubCategoriesInput(e.target.value)}
                placeholder="e.g. Silk Tunics, Embroidered Capes, Tailored Corsets"
                className="w-full px-3 py-2 bg-[#181311] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
              />
              <p className="text-[10px] text-[#7F6B5C] mt-1">
                Subcategories enable hierarchical nesting in the catalog.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center justify-center space-x-1"
            >
              {isSubmitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <Plus size={14} />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Categories Hierarchy List */}
        <div className="lg:col-span-2 bg-[#221B17] border border-[#3E322A] p-6 rounded-xs shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#342922]">
            <h3 className="font-serif text-lg text-[#FAF7F2] font-medium flex items-center space-x-2">
              <Layers size={16} className="text-[#B49A62]" />
              <span>Catalog Taxonomy ({categories.length})</span>
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-[#7F6B5C]">
              Safety Block: Cannot delete if products linked
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#A69483]">
              <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[#B49A62]" />
              Loading categories...
            </div>
          ) : (
            <div className="divide-y divide-[#2E241E]">
              {categories.map((cat) => (
                <div key={cat._id} className="py-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif text-base text-[#FAF7F2] font-medium mr-2">
                        {cat.name}
                      </span>
                      <span className="font-mono text-[10px] text-[#A69483] bg-[#181311] px-2 py-0.5 rounded-xs border border-[#342922]">
                        {cat.slug}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(cat._id, cat.name)}
                      className="text-[#8E7766] hover:text-rose-400 p-1.5 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-[#8E7766] font-light">{cat.description}</p>
                  )}

                  {/* Subcategories pill tags */}
                  {cat.subCategories && cat.subCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cat.subCategories.map((sub, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[#181311] text-[#C8B8A6] border border-[#3E322A] text-[10px] rounded-xs flex items-center space-x-1"
                        >
                          <ChevronRight size={10} className="text-[#B49A62]" />
                          <span>{typeof sub === 'string' ? sub : sub.name}</span>
                        </span>
                      ))}
                    </div>
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
