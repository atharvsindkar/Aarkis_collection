import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Image, Layers, Sparkles, Send, 
  AlertCircle, Check, Loader2, X, Eye 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';

export default function AdminProducts() {
  const { authFetch } = useAdminAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Product View / Modal
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory Form Fields
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [description, setDescription] = useState('');
  const [highlightsInput, setHighlightsInput] = useState(''); // newline separated
  const [fabric, setFabric] = useState('');
  const [care, setCare] = useState('');
  const [badge, setBadge] = useState('New Release');
  
  // Rules
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isComingSoon, setIsComingSoon] = useState(false);
  const [sendSubscriberEmail, setSendSubscriberEmail] = useState(false);

  // Color Variants with Stock Matrix
  const [variants, setVariants] = useState([
    {
      id: 'midnight-emerald',
      colorName: 'Midnight Emerald',
      colorHex: '#143828',
      image: '/images/products/waistcoat-charcoal-grey.jpg',
      inventory: { S: 5, M: 8, L: 6, XL: 3 }
    }
  ]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [pRes, cRes] = await Promise.all([
        authFetch('/api/products/admin/all'),
        authFetch('/api/categories')
      ]);

      const pData = await pRes.json();
      const cData = await cRes.json();

      if (pRes.ok && pData.success) {
        setProducts(pData.products || []);
      }
      if (cRes.ok && cData.success) {
        setCategories(cData.categories || []);
        if (cData.categories.length > 0 && !categoryId) {
          setCategoryId(cData.categories[0].slug || cData.categories[0]._id);
        }
      }
    } catch (err) {
      setError('Catalog fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Variant helpers
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `variant-${Date.now()}`,
        colorName: 'New Color',
        colorHex: '#000000',
        image: '/images/products/waistcoat-charcoal-grey.jpg',
        inventory: { S: 5, M: 5, L: 5, XL: 2 }
      }
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) {
      alert('Product must retain at least one color variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariantField = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const updateVariantStock = (vIndex, size, qty) => {
    const updated = [...variants];
    updated[vIndex].inventory = {
      ...(updated[vIndex].inventory || {}),
      [size]: Math.max(0, parseInt(qty) || 0)
    };
    setVariants(updated);
  };

  // Submit Product Creation
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Mandatory Validations
    const sp = parseFloat(sellingPrice);
    const m = parseFloat(mrp);

    if (isNaN(sp) || sp <= 0) {
      setError('Selling price must be strictly greater than 0.');
      return;
    }
    if (isNaN(m) || m < sp) {
      setError('MRP must be equal to or greater than selling price.');
      return;
    }

    const selectedCat = categories.find(c => c.slug === categoryId || c._id === categoryId);
    const highlights = highlightsInput
      .split('\n')
      .map(h => h.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        shortName: shortName.trim() || name.trim(),
        categoryId,
        category: selectedCat ? selectedCat.name : categoryId,
        subCategory: subCategory.trim(),
        price: sp,
        mrp: m,
        description: description.trim(),
        highlights,
        details: highlights,
        fabric: fabric.trim(),
        care: care.trim(),
        badge,
        variants,
        sizes: ['S', 'M', 'L', 'XL'],
        isNewArrival,
        isComingSoon,
        sendSubscriberEmail
      };

      const res = await authFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Product "${name}" successfully launched and registered!`);
        setShowAddForm(false);
        // Reset form
        setName('');
        setShortName('');
        setSellingPrice('');
        setMrp('');
        setDescription('');
        setHighlightsInput('');
        fetchCatalog();
      } else {
        setError(data.message || 'Creation failed');
      }
    } catch (err) {
      setError('Failed to create product due to network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Archive / remove garment "${title}" from atelier catalog?`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Garment "${title}" archived.`);
        fetchCatalog();
      } else {
        alert(data.message || 'Failed to archive');
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#342922]">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Catalog Governance
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#FAF7F2] font-normal">
            Products & Variant Stock
          </h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setError('');
            setSuccess('');
          }}
          className="px-4 py-2 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center space-x-1.5 transition-colors shadow"
        >
          <Plus size={15} />
          <span>Add New Product</span>
        </button>
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => {
          const totalStock = (p.variants || []).reduce((acc, v) => {
            return acc + Object.values(v.inventory || {}).reduce((s, qty) => s + (parseInt(qty) || 0), 0);
          }, 0);

          return (
            <div
              key={p._id}
              className="bg-[#221B17] border border-[#3E322A] rounded-xs overflow-hidden shadow-lg flex flex-col justify-between group hover:border-[#B49A62]/40 transition-colors"
            >
              <div>
                {/* Image Preview */}
                <div className="h-56 bg-[#181311] relative overflow-hidden">
                  <img
                    src={p.variants?.[0]?.image || '/images/products/waistcoat-charcoal-grey.jpg'}
                    alt={p.name}
                    className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 bg-[#181311]/90 backdrop-blur-xs text-[#B49A62] border border-[#B49A62]/40 text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                      {p.category}
                    </span>
                    {p.isComingSoon && (
                      <span className="px-2 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-800 text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-serif text-base text-[#FAF7F2] font-medium leading-tight">
                        {p.shortName || p.name}
                      </h3>
                      <p className="text-[10px] text-[#A69483]">{p.subCategory || 'Capsule Edit'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-serif text-base font-semibold text-[#FAF7F2]">
                        ₹{p.price?.toLocaleString()}
                      </p>
                      {p.mrp && p.mrp > p.price && (
                        <p className="text-[10px] text-[#7F6B5C] line-through">
                          MRP ₹{p.mrp?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variants */}
                  <div className="pt-2 border-t border-[#342922] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1.5">
                      {p.variants?.map((v, i) => (
                        <span
                          key={i}
                          title={v.colorName}
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      ))}
                      <span className="text-[11px] text-[#8E7766] ml-1">
                        {p.variants?.length} Shades
                      </span>
                    </div>

                    <span className={`text-[11px] font-semibold ${totalStock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {totalStock} in stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-[#1A1412] border-t border-[#342922] flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-mono text-[#7F6B5C]">
                  ID: {p._id.slice(-6)}
                </span>
                <button
                  onClick={() => handleDeleteProduct(p._id, p.name)}
                  className="p-1 text-[#8E7766] hover:text-rose-400 transition-colors"
                  title="Archive product"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLETE MANDATORY ADD PRODUCT MODAL / DRAWER */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex justify-center p-4 sm:p-6 my-auto">
          <div className="bg-[#1C1613] border border-[#3E322A] rounded-xs w-full max-w-4xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto text-xs text-[#FAF7F2]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#342922]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#B49A62] font-semibold">
                  Catalog Publishing Engine
                </span>
                <h3 className="font-serif text-2xl font-light text-[#FAF7F2]">
                  Add New Atelier Garment
                </h3>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-1.5 text-[#8E7766] hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-6">
              
              {/* Product Names & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Garment Full Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarkis Women's Tailored Brocade Vest Set"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Short Brand Name</label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="e.g. Tailored Brocade Vest Set"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Selling Price (₹) * [Must be &gt; 0]</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 3490"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">MRP (₹) * [Must be &gt;= Selling Price]</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="e.g. 4490"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>
              </div>

              {/* Taxonomy Categorization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Primary Discipline / Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Subcategory Hierarchy (Up to 4 levels)</label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Western Wear > Suits & Blazers > Waistcoats"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>
              </div>

              {/* Description & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">Editorial Description *</label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tailoring, silhouette drape, occasion pairing..."
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A69483] mb-1">
                    Garment Highlights (One per line) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={highlightsInput}
                    onChange={(e) => setHighlightsInput(e.target.value)}
                    placeholder="Notch lapel with sharp angled hem&#10;Functional slash pockets&#10;High-rise straight silhouette trouser"
                    className="w-full px-3 py-2 bg-[#140F0D] border border-[#3E322A] text-white rounded-xs focus:outline-none focus:border-[#B49A62]"
                  />
                </div>
              </div>

              {/* Color Variants and Matrix Inventory */}
              <div className="space-y-4 pt-2 border-t border-[#342922]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold">
                    Color Variants & S/M/L/XL Stock Matrix
                  </h4>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="px-3 py-1 bg-[#2E241E] hover:bg-[#3E322A] text-white border border-[#4A3B31] text-[11px] rounded-xs uppercase tracking-wider"
                  >
                    + Add Color Variant
                  </button>
                </div>

                {variants.map((v, idx) => (
                  <div key={v.id} className="p-4 bg-[#140F0D] border border-[#3E322A] rounded-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#28201B]">
                      <span className="font-semibold text-[#FAF7F2]">Variant #{idx + 1}</span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          Remove Variant
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-[#8E7766] mb-1">Color Shade Name</label>
                        <input
                          type="text"
                          required
                          value={v.colorName}
                          onChange={(e) => updateVariantField(idx, 'colorName', e.target.value)}
                          placeholder="e.g. Charcoal Grey"
                          className="w-full px-2.5 py-1.5 bg-[#1C1613] border border-[#3E322A] text-white rounded-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#8E7766] mb-1">Hex Code</label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={v.colorHex}
                            onChange={(e) => updateVariantField(idx, 'colorHex', e.target.value)}
                            className="w-8 h-8 rounded-xs cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={v.colorHex}
                            onChange={(e) => updateVariantField(idx, 'colorHex', e.target.value)}
                            className="flex-1 px-2.5 py-1.5 bg-[#1C1613] border border-[#3E322A] text-white font-mono text-[11px] rounded-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#8E7766] mb-1">Image URL / Asset</label>
                        <input
                          type="text"
                          required
                          value={v.image}
                          onChange={(e) => updateVariantField(idx, 'image', e.target.value)}
                          placeholder="/images/products/..."
                          className="w-full px-2.5 py-1.5 bg-[#1C1613] border border-[#3E322A] text-white rounded-xs"
                        />
                      </div>
                    </div>

                    {/* Stock by size */}
                    <div>
                      <label className="block text-[10px] text-[#8E7766] mb-1">Inventory by Size</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map((size) => (
                          <div key={size} className="flex items-center space-x-1.5 bg-[#1C1613] p-1.5 border border-[#3E322A] rounded-xs">
                            <span className="text-[10px] font-semibold text-[#B49A62] w-5">{size}:</span>
                            <input
                              type="number"
                              min="0"
                              value={v.inventory?.[size] ?? 0}
                              onChange={(e) => updateVariantStock(idx, size, e.target.value)}
                              className="w-full bg-transparent text-white text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Toggles & Email Notification */}
              <div className="pt-2 border-t border-[#342922] space-y-3">
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="accent-[#B49A62]"
                    />
                    <span className="text-xs text-[#FAF7F2]">Flag as "New Arrival"</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isComingSoon}
                      onChange={(e) => setIsComingSoon(e.target.checked)}
                      className="accent-[#B49A62]"
                    />
                    <span className="text-xs text-[#FAF7F2]">Flag as "Coming Soon" (Preview Mode)</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer bg-[#2E241E] px-3 py-1.5 rounded-xs border border-[#4A3B31]">
                    <input
                      type="checkbox"
                      checked={sendSubscriberEmail}
                      onChange={(e) => setSendSubscriberEmail(e.target.checked)}
                      className="accent-[#B49A62]"
                    />
                    <span className="text-xs text-amber-200 flex items-center space-x-1">
                      <Send size={12} />
                      <span>Broadcast Launch Email to all Newsletter Subscribers</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-[#342922] flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 bg-[#2E241E] text-xs uppercase tracking-wider text-[#A69483] rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center space-x-2 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Publishing Garment...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Garment</span>
                      <Sparkles size={14} />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
