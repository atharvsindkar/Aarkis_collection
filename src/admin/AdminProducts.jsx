import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Image, Layers, Sparkles, Send, 
  AlertCircle, Check, Loader2, X, Eye, Upload, CheckCircle2, Power 
} from 'lucide-react';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminTheme } from './AdminThemeContext';

export default function AdminProducts() {
  const { authFetch } = useAdminAuth();
  const { isDark } = useAdminTheme();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal Mode: null | 'add' | 'edit'
  const [modalMode, setModalMode] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);

  // Form Fields
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

  // Open Add Modal
  const openAddModal = () => {
    setModalMode('add');
    setEditingProductId(null);
    setName('');
    setShortName('');
    setCategoryId(categories[0]?.slug || '');
    setSubCategory('');
    setSellingPrice('');
    setMrp('');
    setDescription('');
    setHighlightsInput('');
    setFabric('');
    setCare('');
    setBadge('New Release');
    setIsNewArrival(true);
    setIsComingSoon(false);
    setSendSubscriberEmail(false);
    setVariants([
      {
        id: `variant-${Date.now()}`,
        colorName: 'Primary Shade',
        colorHex: '#34251F',
        image: '/images/products/waistcoat-charcoal-grey.jpg',
        images: ['/images/products/waistcoat-charcoal-grey.jpg'],
        inventory: { S: 5, M: 8, L: 6, XL: 3 }
      }
    ]);
    setError('');
    setSuccess('');
  };

  // Open Edit Modal with Existing Data
  const openEditModal = (product) => {
    setModalMode('edit');
    setEditingProductId(product._id);
    setName(product.name || '');
    setShortName(product.shortName || '');
    setCategoryId(product.categoryId || product.category || '');
    setSubCategory(product.subCategory || '');
    setSellingPrice(product.price ? product.price.toString() : '');
    setMrp(product.mrp ? product.mrp.toString() : '');
    setDescription(product.description || '');
    setHighlightsInput((product.highlights || product.details || []).join('\n'));
    setFabric(product.fabric || '');
    setCare(product.care || '');
    setBadge(product.badge || '');
    setIsNewArrival(Boolean(product.isNewArrival));
    setIsComingSoon(Boolean(product.isComingSoon));
    setSendSubscriberEmail(false);
    setVariants(
      (product.variants && product.variants.length > 0)
        ? product.variants.map(v => {
            const vImage = v.image || (v.images && v.images[0]) || '';
            const vImages = (v.images && v.images.length > 0) ? v.images : (vImage ? [vImage] : []);
            return {
              ...v,
              colorName: v.colorName || v.name || 'Shade',
              image: vImage,
              images: vImages,
              inventory: v.inventory || { S: 5, M: 5, L: 5, XL: 5 }
            };
          })
        : [
            {
              id: 'variant-1',
              colorName: 'Primary Shade',
              colorHex: '#34251F',
              image: '/images/products/waistcoat-charcoal-grey.jpg',
              images: ['/images/products/waistcoat-charcoal-grey.jpg'],
              inventory: { S: 5, M: 8, L: 6, XL: 3 }
            }
          ]
    );
    setError('');
    setSuccess('');
  };

  // Variant helpers
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `variant-${Date.now()}`,
        colorName: 'New Shade',
        colorHex: '#484B4E',
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

  // Multi-Image Upload Handler for Variants
  const handleMultipleImageUpload = async (vIndex, fileList) => {
    if (!fileList || fileList.length === 0) return;

    try {
      setUploadingVariantIndex(vIndex);
      setError('');
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        formData.append('images', fileList[i]);
      }

      const res = await authFetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const newUrls = data.imageUrls || (data.imageUrl ? [data.imageUrl] : []);
        const updated = [...variants];
        const currentImages = updated[vIndex].images || (updated[vIndex].image ? [updated[vIndex].image] : []);
        const mergedImages = [...currentImages, ...newUrls];
        updated[vIndex].images = mergedImages;
        if (!updated[vIndex].image || updated[vIndex].image === '') {
          updated[vIndex].image = mergedImages[0];
        }
        setVariants(updated);
        setSuccess(`${newUrls.length} ${newUrls.length === 1 ? 'image' : 'images'} uploaded successfully for variant #${vIndex + 1}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Image upload failed');
      }
    } catch (err) {
      setError('Network error while uploading image');
    } finally {
      setUploadingVariantIndex(null);
    }
  };

  const removeVariantImage = (vIndex, imgIndex) => {
    const updated = [...variants];
    const currentImages = [...(updated[vIndex].images || [])];
    currentImages.splice(imgIndex, 1);
    updated[vIndex].images = currentImages;
    if (updated[vIndex].image && !currentImages.includes(updated[vIndex].image)) {
      updated[vIndex].image = currentImages[0] || '';
    }
    setVariants(updated);
  };

  const setCoverImage = (vIndex, imgUrl) => {
    const updated = [...variants];
    updated[vIndex].image = imgUrl;
    setVariants(updated);
  };

  const addManualImageUrl = (vIndex, url) => {
    if (!url || !url.trim()) return;
    const clean = url.trim();
    const updated = [...variants];
    const currentImages = updated[vIndex].images || (updated[vIndex].image ? [updated[vIndex].image] : []);
    if (!currentImages.includes(clean)) {
      currentImages.push(clean);
    }
    updated[vIndex].images = currentImages;
    if (!updated[vIndex].image) {
      updated[vIndex].image = clean;
    }
    setVariants(updated);
  };

  // Submit Product (Add or Edit)
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Mandatory Validations
    const sp = parseFloat(sellingPrice);
    const m = mrp ? parseFloat(mrp) : null;

    if (isNaN(sp) || sp <= 0) {
      setError('Selling price must be a positive number greater than 0.');
      return;
    }
    if (m !== null && m < sp) {
      setError('MRP must be equal to or greater than the selling price.');
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
        category: selectedCat ? selectedCat.name : (categoryId || 'Western Wear'),
        subCategory: subCategory.trim(),
        price: sp,
        sellingPrice: sp,
        mrp: m,
        description: description.trim(),
        highlights,
        details: highlights,
        fabric: fabric.trim(),
        care: care.trim(),
        badge,
        variants: variants.map(v => {
          const cover = v.image || (v.images && v.images[0]) || '/images/products/waistcoat-charcoal-grey.jpg';
          const list = (v.images && v.images.length > 0) ? v.images : [cover];
          return {
            ...v,
            image: cover,
            images: list
          };
        }),
        sizes: ['S', 'M', 'L', 'XL'],
        isNewArrival,
        isComingSoon,
        sendSubscriberEmail
      };

      const url = modalMode === 'edit' ? `/api/products/${editingProductId}` : '/api/products';
      const method = modalMode === 'edit' ? 'PUT' : 'POST';

      const res = await authFetch(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(modalMode === 'edit' 
          ? `Product "${name}" updated successfully!` 
          : `Product "${name}" successfully launched and registered!`
        );
        setModalMode(null);
        fetchCatalog();
      } else {
        setError(data.message || 'Operation failed');
      }
    } catch (err) {
      setError('Failed to save product due to network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, title, currentStatus) => {
    try {
      const res = await authFetch(`/api/products/${id}/toggle-status`, { method: 'PATCH' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message || `Status updated for "${title}".`);
        fetchCatalog();
      } else {
        alert(data.message || 'Failed to update garment status');
      }
    } catch (err) {
      alert('Network request failed');
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Permanently delete garment "${title}" from everywhere (storefront & database)? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Garment "${title}" permanently deleted.`);
        fetchCatalog();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b ${
        isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
      }`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#B49A62] font-semibold">
            Catalog Governance
          </span>
          <h2 className={`font-serif text-2xl sm:text-3xl font-normal ${
            isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
          }`}>
            Products & Variant Stock
          </h2>
        </div>
        <button
          onClick={openAddModal}
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
              className={`rounded-xs overflow-hidden shadow-lg flex flex-col justify-between group transition-colors border ${
                isDark 
                  ? 'bg-[#221B17] border-[#3E322A] hover:border-[#B49A62]/40' 
                  : 'bg-white border-[#E8E0D2] hover:border-[#B49A62]'
              }`}
            >
              <div>
                {/* Image Preview */}
                <div className={`h-56 relative overflow-hidden ${isDark ? 'bg-[#181311]' : 'bg-[#EFE8DD]'}`}>
                  <img
                    src={p.variants?.[0]?.image || '/images/products/waistcoat-charcoal-grey.jpg'}
                    alt={p.name}
                    className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className="px-2 py-0.5 bg-black/80 backdrop-blur-xs text-[#B49A62] border border-[#B49A62]/40 text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                      {p.category}
                    </span>
                    {p.status === 'inactive' ? (
                      <span className="px-2 py-0.5 bg-rose-950/90 text-rose-300 border border-rose-800 text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                        Disabled (Hidden)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[9px] uppercase tracking-wider rounded-xs font-semibold">
                        Active (Storefront)
                      </span>
                    )}
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
                      <h3 className={`font-serif text-base font-medium leading-tight ${
                        isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
                      }`}>
                        {p.shortName || p.name}
                      </h3>
                      <p className={`text-[10px] ${isDark ? 'text-[#A69483]' : 'text-[#8E7766]'}`}>
                        {p.subCategory || 'Capsule Edit'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-serif text-base font-semibold ${
                        isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'
                      }`}>
                        ₹{p.price?.toLocaleString()}
                      </p>
                      {p.mrp && p.mrp > p.price && (
                        <p className={`text-[10px] line-through ${isDark ? 'text-[#7F6B5C]' : 'text-[#9A8777]'}`}>
                          MRP ₹{p.mrp?.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Variants */}
                  <div className={`pt-2 border-t flex items-center justify-between text-xs ${
                    isDark ? 'border-[#342922]' : 'border-[#EDE5D8]'
                  }`}>
                    <div className="flex items-center space-x-1.5">
                      {p.variants?.map((v, i) => (
                        <span
                          key={i}
                          title={v.colorName}
                          className="w-3.5 h-3.5 rounded-full border border-black/30"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      ))}
                      <span className={`text-[11px] ml-1 ${isDark ? 'text-[#8E7766]' : 'text-[#7F6B5C]'}`}>
                        {p.variants?.length} Shades
                      </span>
                    </div>

                    <span className={`text-[11px] font-semibold ${totalStock <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {totalStock} in stock
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className={`p-3 border-t flex items-center justify-between text-xs ${
                isDark ? 'bg-[#1A1412] border-[#342922]' : 'bg-[#FAF7F2] border-[#E8E0D2]'
              }`}>
                <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-[#7F6B5C]' : 'text-[#8E7766]'}`}>
                  ID: {p._id.slice(-6)}
                </span>
                <div className="flex items-center space-x-1.5">
                  {/* Enable / Disable Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(p._id, p.name, p.status)}
                    className={`px-2 py-1 rounded-xs transition-colors flex items-center space-x-1 text-[11px] uppercase tracking-wider font-medium ${
                      p.status === 'inactive'
                        ? 'text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                    title={p.status === 'inactive' ? 'Click to Enable (show in store)' : 'Click to Disable (hide from storefront)'}
                  >
                    <Power size={12} />
                    <span>{p.status === 'inactive' ? 'Enable' : 'Disable'}</span>
                  </button>

                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-[#B49A62] hover:text-amber-400 hover:bg-[#B49A62]/10 rounded-xs transition-colors flex items-center space-x-1"
                    title="Edit garment details"
                  >
                    <Edit2 size={13} />
                    <span className="text-[11px] uppercase tracking-wider font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p._id, p.name)}
                    className="p-1.5 text-[#8E7766] hover:text-rose-500 hover:bg-rose-500/10 rounded-xs transition-colors"
                    title="Permanently delete garment"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPLETE MANDATORY ADD / EDIT PRODUCT MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className={`border rounded-xs w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden my-auto text-xs ${
            isDark ? 'bg-[#1C1613] border-[#3E322A] text-[#FAF7F2]' : 'bg-[#FAF7F2] border-[#D8C2A0] text-[#281D18]'
          }`}>
            
            {/* Header */}
            <div className={`flex items-center justify-between p-5 sm:p-6 border-b flex-shrink-0 ${
              isDark ? 'border-[#342922] bg-[#221B17]' : 'border-[#E8E0D2] bg-white'
            }`}>
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#B49A62] font-semibold">
                  {modalMode === 'edit' ? 'Garment Editor' : 'Catalog Publishing Engine'}
                </span>
                <h3 className={`font-serif text-2xl font-light ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                  {modalMode === 'edit' ? `Edit Garment: ${name}` : 'Add New Atelier Garment'}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className={`p-1.5 rounded-full transition-colors ${
                  isDark ? 'text-[#8E7766] hover:text-white' : 'text-[#8E7766] hover:text-black'
                }`}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Product Names & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Garment Full Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarkis Women's Tailored Brocade Vest Set"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Short Brand Name
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => setShortName(e.target.value)}
                    placeholder="e.g. Tailored Brocade Vest Set"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Selling Price (₹) * [Must be &gt; 0]
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 3490"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    MRP (₹) [Comparison price, must be &gt;= Selling Price]
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="e.g. 4490"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Taxonomy Categorization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Primary Discipline / Category *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.slug || c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Subcategory Hierarchy (Up to 4 levels)
                  </label>
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="e.g. Western Wear > Suits & Blazers > Waistcoats"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Description & Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Editorial Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe tailoring, silhouette drape, occasion pairing..."
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Garment Highlights (One per line) *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={highlightsInput}
                    onChange={(e) => setHighlightsInput(e.target.value)}
                    placeholder="Notch lapel with sharp angled hem&#10;Functional slash pockets&#10;High-rise straight silhouette trouser"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Fabric & Care */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Fabric Specification
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. Breathable Silk-Linen Blend"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-[11px] mb-1 font-medium ${isDark ? 'text-[#A69483]' : 'text-[#6F5847]'}`}>
                    Care Instructions
                  </label>
                  <input
                    type="text"
                    value={care}
                    onChange={(e) => setCare(e.target.value)}
                    placeholder="e.g. Dry clean recommended"
                    className={`w-full px-3 py-2 border rounded-xs focus:outline-none focus:border-[#B49A62] ${
                      isDark ? 'bg-[#140F0D] border-[#3E322A] text-white' : 'bg-white border-[#D8C2A0] text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Color Variants and Matrix Inventory WITH DIRECT UPLOAD */}
              <div className={`space-y-4 pt-4 border-t ${isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase tracking-wider text-[#B49A62] font-semibold">
                    Color Variants & S/M/L/XL Stock Matrix
                  </h4>
                  <button
                    type="button"
                    onClick={addVariant}
                    className={`px-3 py-1.5 border text-[11px] rounded-xs uppercase tracking-wider transition-colors ${
                      isDark 
                        ? 'bg-[#2E241E] hover:bg-[#3E322A] text-white border-[#4A3B31]' 
                        : 'bg-white hover:bg-[#FAF7F2] text-[#281D18] border-[#D8C2A0]'
                    }`}
                  >
                    + Add Color Variant
                  </button>
                </div>

                {variants.map((v, idx) => (
                  <div key={v.id || idx} className={`p-4 border rounded-xs space-y-3 ${
                    isDark ? 'bg-[#140F0D] border-[#3E322A]' : 'bg-white border-[#E8E0D2]'
                  }`}>
                    <div className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? 'border-[#28201B]' : 'border-[#F0EAE1]'
                    }`}>
                      <span className={`font-semibold ${isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}`}>
                        Variant #{idx + 1}: {v.colorName}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="text-rose-500 hover:text-rose-600 text-[11px] uppercase tracking-wider"
                        >
                          Remove Variant
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={`block text-[10px] mb-1 ${isDark ? 'text-[#8E7766]' : 'text-[#7A6757]'}`}>
                          Color Shade Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={v.colorName}
                          onChange={(e) => updateVariantField(idx, 'colorName', e.target.value)}
                          placeholder="e.g. Charcoal Grey"
                          className={`w-full px-2.5 py-1.5 border rounded-xs ${
                            isDark ? 'bg-[#1C1613] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-[10px] mb-1 ${isDark ? 'text-[#8E7766]' : 'text-[#7A6757]'}`}>
                          Hex Code
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={v.colorHex || '#000000'}
                            onChange={(e) => updateVariantField(idx, 'colorHex', e.target.value)}
                            className="w-8 h-8 rounded-xs cursor-pointer bg-transparent border-0"
                          />
                          <input
                            type="text"
                            value={v.colorHex}
                            onChange={(e) => updateVariantField(idx, 'colorHex', e.target.value)}
                            className={`flex-1 px-2.5 py-1.5 border font-mono text-[11px] rounded-xs ${
                              isDark ? 'bg-[#1C1613] border-[#3E322A] text-white' : 'bg-[#FAF7F2] border-[#D8C2A0] text-black'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Multiple Image Upload & Gallery */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className={`block text-[10px] font-medium ${isDark ? 'text-[#8E7766]' : 'text-[#7A6757]'}`}>
                            Variant Photos (Upload Multiple or Single) *
                          </label>
                          <span className="text-[10px] text-[#B49A62]">
                            {(v.images?.length || (v.image ? 1 : 0))} {(v.images?.length || (v.image ? 1 : 0)) === 1 ? 'image' : 'images'}
                          </span>
                        </div>

                        {/* Upload Button & Manual URL */}
                        <div className="flex items-center space-x-2">
                          <label className="flex-1 py-2 px-3 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold text-[11px] uppercase tracking-wider rounded-xs cursor-pointer flex items-center justify-center space-x-2 transition-colors shadow-xs">
                            {uploadingVariantIndex === idx ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Upload size={13} />
                            )}
                            <span>{uploadingVariantIndex === idx ? 'Uploading Photos...' : 'Upload Images (Select Multiple)'}</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleMultipleImageUpload(idx, e.target.files);
                                }
                              }}
                            />
                          </label>
                        </div>

                        {/* Image Gallery Strip */}
                        {((v.images && v.images.length > 0) || v.image) && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {(v.images && v.images.length > 0 ? v.images : [v.image]).map((imgUrl, imgIdx) => {
                              const isCover = (v.image === imgUrl) || (!v.image && imgIdx === 0);
                              return (
                                <div
                                  key={imgIdx}
                                  className={`relative group rounded-xs overflow-hidden border ${
                                    isCover ? 'border-[#B49A62] ring-1 ring-[#B49A62]' : 'border-[#3E322A]'
                                  }`}
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Variant photo ${imgIdx + 1}`}
                                    className="w-14 h-16 object-cover object-top"
                                  />
                                  {isCover && (
                                    <span className="absolute top-0.5 left-0.5 bg-[#B49A62] text-[#181311] text-[8px] font-bold px-1 py-0.2 rounded-xs uppercase tracking-tighter">
                                      Cover
                                    </span>
                                  )}
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1 p-1">
                                    {!isCover && (
                                      <button
                                        type="button"
                                        onClick={() => setCoverImage(idx, imgUrl)}
                                        className="p-1 bg-[#B49A62] text-[#181311] rounded-xs text-[8px] uppercase font-semibold"
                                        title="Make primary cover image"
                                      >
                                        Cover
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeVariantImage(idx, imgIdx)}
                                      className="p-1 bg-red-600 text-white rounded-xs"
                                      title="Remove photo"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stock by size */}
                    <div>
                      <label className={`block text-[10px] mb-1 ${isDark ? 'text-[#8E7766]' : 'text-[#7A6757]'}`}>
                        Inventory by Size (Pieces)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {['S', 'M', 'L', 'XL'].map((size) => (
                          <div key={size} className={`flex items-center space-x-1.5 p-1.5 border rounded-xs ${
                            isDark ? 'bg-[#1C1613] border-[#3E322A]' : 'bg-[#FAF7F2] border-[#D8C2A0]'
                          }`}>
                            <span className="text-[10px] font-semibold text-[#B49A62] w-5">{size}:</span>
                            <input
                              type="number"
                              min="0"
                              value={v.inventory?.[size] ?? 0}
                              onChange={(e) => updateVariantStock(idx, size, e.target.value)}
                              className={`w-full bg-transparent text-xs font-semibold focus:outline-none ${
                                isDark ? 'text-white' : 'text-black'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Toggles & Email Notification */}
              <div className={`pt-3 border-t space-y-3 ${isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'}`}>
                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNewArrival}
                      onChange={(e) => setIsNewArrival(e.target.checked)}
                      className="accent-[#B49A62]"
                    />
                    <span className={isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}>Flag as "New Arrival"</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isComingSoon}
                      onChange={(e) => setIsComingSoon(e.target.checked)}
                      className="accent-[#B49A62]"
                    />
                    <span className={isDark ? 'text-[#FAF7F2]' : 'text-[#281D18]'}>Flag as "Coming Soon" (Preview Mode)</span>
                  </label>

                  {modalMode === 'add' && (
                    <label className={`flex items-center space-x-2 cursor-pointer px-3 py-1.5 rounded-xs border ${
                      isDark ? 'bg-[#2E241E] border-[#4A3B31]' : 'bg-[#FAF7F2] border-[#D8C2A0]'
                    }`}>
                      <input
                        type="checkbox"
                        checked={sendSubscriberEmail}
                        onChange={(e) => setSendSubscriberEmail(e.target.checked)}
                        className="accent-[#B49A62]"
                      />
                      <span className="text-xs text-amber-600 flex items-center space-x-1">
                        <Send size={12} />
                        <span>Broadcast Launch Email to Subscribers</span>
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className={`pt-4 border-t flex justify-end space-x-3 ${
                isDark ? 'border-[#342922]' : 'border-[#E8E0D2]'
              }`}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className={`px-5 py-2.5 text-xs uppercase tracking-wider rounded-xs transition-colors ${
                    isDark ? 'bg-[#2E241E] text-[#A69483] hover:text-white' : 'bg-[#EFE8DD] text-[#6F5847] hover:text-black'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#B49A62] hover:bg-[#A38853] text-[#181311] font-semibold uppercase tracking-wider text-xs rounded-xs flex items-center space-x-2 shadow-lg disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{modalMode === 'edit' ? 'Saving Changes...' : 'Publishing Garment...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{modalMode === 'edit' ? 'Save Changes' : 'Launch Garment'}</span>
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
