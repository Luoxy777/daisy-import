// src/pages/Admin.jsx
import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { ChevronDown, ImagePlus, X, Plus, Trash2, FolderPlus, LogOut, ArrowLeft } from 'lucide-react'; import getCroppedImg from '../utils/cropImage';
import { supabase } from '../supabaseClient';

// ==========================================
// COMPONENT: AddCategoryModal
// ==========================================
function AddCategoryModal({ isOpen, onClose, onCategoryAdded }) {
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setNewCategoryName('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = newCategoryName.trim();

        if (!trimmedName) {
            setError('Nama kategori tidak boleh kosong!');
            return;
        }

        if (trimmedName.length < 2) {
            setError('Nama kategori minimal 2 karakter!');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Cek apakah kategori sudah ada (case-insensitive)
            const { data: existingCategory } = await supabase
                .from('categories')
                .select('name')
                .ilike('name', trimmedName)
                .maybeSingle();

            if (existingCategory) {
                setError(`Kategori "${trimmedName}" sudah ada! Gunakan nama lain.`);
                setIsSubmitting(false);
                return;
            }

            const { data, error: insertError } = await supabase
                .from('categories')
                .insert([{ name: trimmedName }])
                .select()
                .single();

            if (insertError) {
                if (insertError.code === '23505') {
                    setError(`Kategori "${trimmedName}" sudah ada!`);
                } else {
                    throw insertError;
                }
            } else {
                onCategoryAdded(data);
                setNewCategoryName('');
                onClose();
            }
        } catch (error) {
            console.error('Error adding category:', error);
            setError('Gagal menambahkan kategori: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Tambah Kategori Baru</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Kategori</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => { setNewCategoryName(e.target.value); if (error) setError(''); }}
                            placeholder="Contoh: Aksesoris, Sepatu, Tas"
                            className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-black outline-none ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                            autoFocus
                            disabled={isSubmitting}
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <span>⚠️</span> {error}
                            </p>
                        )}
                        {newCategoryName.trim() && !error && (
                            <p className="mt-2 text-xs text-gray-400">
                                Kategori: <span className="font-medium text-gray-600">"{newCategoryName.trim()}"</span>
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50">
                            Batal
                        </button>
                        <button type="submit" disabled={isSubmitting || !newCategoryName.trim()}
                            className="flex-1 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ==========================================
// COMPONENT: ADMIN
// ==========================================
export default function Admin() {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
    const [useVariants, setUseVariants] = useState(true);
    const [generalImages, setGeneralImages] = useState([]);

    const [generalSizes, setGeneralSizes] = useState([]);
    const [variants, setVariants] = useState([
        {
            id: Date.now().toString(),
            colorName: '',
            colorHex: '#000000',
            images: [],
            sizes: []
        }
    ]);

    const availableSizes = ['S', 'M', 'L', 'XL', 'All Size'];

    const [activeVariantId, setActiveVariantId] = useState(null);
    const [isGeneralImage, setIsGeneralImage] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Fetch categories
    const fetchCategories = async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
        if (data && !error) {
            setCategories(data);
            if (data.length > 0 && !categoryId) setCategoryId(data[0].id);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const handleCategoryAdded = (newCategory) => {
        setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
        setCategoryId(newCategory.id);
    };

    // ===== SIZE MANAGEMENT =====
    const toggleSizeForVariant = (variantId, size) => {
        setVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v;
            const exists = v.sizes.find(s => s.size === size);
            if (exists) {
                return { ...v, sizes: v.sizes.filter(s => s.size !== size) };
            }
            return { ...v, sizes: [...v.sizes, { size, stock: 0 }] };
        }));
    };

    const updateVariantSizeStock = (variantId, size, value) => {
        const stock = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
        setVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v;
            return {
                ...v,
                sizes: v.sizes.map(s => s.size === size ? { ...s, stock } : s)
            };
        }));
    };

    const toggleGeneralSize = (size) => {
        setGeneralSizes(prev => {
            const exists = prev.find(s => s.size === size);
            if (exists) return prev.filter(s => s.size !== size);
            return [...prev, { size, stock: 0 }];
        });
    };

    const updateGeneralSizeStock = (size, value) => {
        const stock = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
        setGeneralSizes(prev => prev.map(s => s.size === size ? { ...s, stock } : s));
    };

    // ===== VARIANT MANAGEMENT =====
    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: Date.now().toString(),
            colorName: '',
            colorHex: '#000000',
            images: [],
            sizes: []
        }]);
    };

    const removeVariant = (id) => setVariants(prev => prev.filter(v => v.id !== id));

    const updateVariant = (id, field, value) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // ===== IMAGE MANAGEMENT =====
    const onFileChange = async (e, variantId = null, isGeneral = false) => {
        if (e.target.files?.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setImageSrc(reader.result);
                setIsGeneralImage(isGeneral);
                setActiveVariantId(isGeneral ? null : variantId);
            });
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const onCropComplete = useCallback((_, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            if (isGeneralImage) {
                setGeneralImages(prev => [...prev, croppedImage]);
            } else if (activeVariantId) {
                setVariants(prev => prev.map(v =>
                    v.id === activeVariantId ? { ...v, images: [...v.images, croppedImage] } : v
                ));
            }
            setImageSrc(null);
            setActiveVariantId(null);
            setIsGeneralImage(false);
        } catch (e) {
            console.error("Gagal memotong gambar", e);
        }
    };

    const removeGeneralImage = (idx) => setGeneralImages(prev => prev.filter((_, i) => i !== idx));
    const removeVariantImage = (variantId, idx) => {
        setVariants(prev => prev.map(v =>
            v.id === variantId ? { ...v, images: v.images.filter((_, i) => i !== idx) } : v
        ));
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = [];

        if (!name.trim()) errors.push('• Nama produk harus diisi');
        if (!categoryId) errors.push('• Pilih kategori produk');
        if (!price || Number(price) <= 0) errors.push('• Harga harus > 0');
        if (!description.trim()) errors.push('• Deskripsi harus diisi');

        if (useVariants) {
            if (variants.length === 0) {
                errors.push('• Tambahkan minimal 1 varian');
            } else {
                variants.forEach((v, i) => {
                    if (!v.colorName.trim()) errors.push(`• Varian #${i + 1}: Nama warna harus diisi`);
                    if (v.images.length === 0) errors.push(`• Varian #${i + 1}: Tambahkan minimal 1 foto`);
                    const totalStock = v.sizes.reduce((sum, s) => sum + s.stock, 0);
                    if (totalStock <= 0) errors.push(`• Varian #${i + 1}: Minimal 1 ukuran harus ada stoknya`);
                });
            }
        } else {
            if (generalImages.length === 0) errors.push('• Tambahkan minimal 1 foto produk');
            const totalStock = generalSizes.reduce((sum, s) => sum + s.stock, 0);
            if (totalStock <= 0) errors.push('• Minimal 1 ukuran harus ada stoknya');
        }

        if (errors.length > 0) {
            alert('Mohon lengkapi data berikut:\n\n' + errors.join('\n'));
            return;
        }

        setIsLoading(true);

        try {
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };

            if (useVariants) {
                const variantsData = [];

                for (const variant of variants) {
                    const uploadedUrls = [];
                    for (const image of variant.images) {
                        const compressedFile = await imageCompression(image, options);
                        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                        const { error: uploadError } = await supabase.storage
                            .from('product-images').upload(fileName, compressedFile);
                        if (uploadError) throw uploadError;
                        const { data: { publicUrl } } = supabase.storage
                            .from('product-images').getPublicUrl(fileName);
                        uploadedUrls.push(publicUrl);
                    }

                    // KIRIM SEMUA SIZES (termasuk stok 0)
                    const sizesData = variant.sizes.map(s => ({
                        size: s.size,
                        stock: s.stock
                    }));

                    variantsData.push({
                        colorName: variant.colorName,
                        colorHex: variant.colorHex,
                        imageUrls: uploadedUrls,
                        sizes: sizesData
                    });
                }

                const totalStock = variantsData.reduce((sum, v) =>
                    sum + v.sizes.reduce((ss, s) => ss + s.stock, 0), 0);

                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .insert([{
                        name,
                        category_id: categoryId,
                        price: Number(price),
                        description,
                        image_url: variantsData[0].imageUrls[0],
                        stock: totalStock,
                        discount_percent: discountPercent
                    }])
                    .select().single();
                if (productError) throw productError;

                const variantsToInsert = variantsData.map(v => ({
                    product_id: productData.id,
                    color_name: v.colorName,
                    color_hex: v.colorHex,
                    image_urls: v.imageUrls,
                    sizes: v.sizes
                }));

                const { error: variantsError } = await supabase
                    .from('product_variants').insert(variantsToInsert);
                if (variantsError) throw variantsError;

            } else {
                const uploadedUrls = [];
                for (const image of generalImages) {
                    const compressedFile = await imageCompression(image, options);
                    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    const { error: uploadError } = await supabase.storage
                        .from('product-images').upload(fileName, compressedFile);
                    if (uploadError) throw uploadError;
                    const { data: { publicUrl } } = supabase.storage
                        .from('product-images').getPublicUrl(fileName);
                    uploadedUrls.push(publicUrl);
                }

                const sizesData = generalSizes.map(s => ({ size: s.size, stock: s.stock }));
                const totalStock = sizesData.reduce((sum, s) => sum + s.stock, 0);

                const { data: productData, error: productError } = await supabase
                    .from('products')
                    .insert([{
                        name,
                        category_id: categoryId,
                        price: Number(price),
                        description,
                        image_url: uploadedUrls[0],
                        stock: totalStock,
                        discount_percent: discountPercent
                    }])
                    .select().single();
                if (productError) throw productError;

                const { error: variantsError } = await supabase
                    .from('product_variants')
                    .insert([{ product_id: productData.id, color_name: '', color_hex: '', image_urls: uploadedUrls, sizes: sizesData }]);
                if (variantsError) throw variantsError;
            }

            alert("✅ Produk berhasil ditambahkan!");

            // Reset form
            setName(''); setPrice(''); setDescription('');
            setGeneralImages([]); setGeneralSizes([]);
            setVariants([{ id: Date.now().toString(), colorName: '', colorHex: '#000000', images: [], sizes: [] }]);
            setUseVariants(true);

        } catch (error) {
            console.error("Error:", error);
            alert("❌ Gagal: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // ===== RENDER =====
    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        <Link to="/admin/products" className="text-gray-500 hover:text-black flex items-center gap-1">
                            <ArrowLeft className="w-3 h-3" /> Daftar Produk
                        </Link>
                    </p>
                </div>
                <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                    <LogOut className="w-4 h-4" /><span className="hidden md:inline">Logout</span>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-xl shadow-sm border">

                {/* Nama Produk */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        placeholder="Contoh: Classic Linen Dress"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>

                {/* Kategori */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex justify-between items-center border border-gray-300 p-3 rounded-lg bg-white">
                                <span>{categories.find(c => c.id === categoryId)?.name || 'Pilih Kategori'}</span>
                                <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isDropdownOpen && (
                                <ul className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                                    {categories.length > 0 ? categories.map(cat => (
                                        <li key={cat.id} onClick={() => { setCategoryId(cat.id); setIsDropdownOpen(false); }}
                                            className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 ${categoryId === cat.id ? 'font-semibold bg-gray-50' : ''}`}>
                                            {cat.name}
                                        </li>
                                    )) : <li className="px-4 py-3 text-sm text-gray-400">Loading...</li>}
                                </ul>
                            )}
                        </div>
                        <button type="button" onClick={() => setIsAddCategoryModalOpen(true)}
                            className="px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm">
                            <FolderPlus className="w-5 h-5" /><span className="hidden md:inline">Kategori Baru</span>
                        </button>
                    </div>
                </div>

                {/* Harga */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harga (Rp) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">Rp</span>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                            placeholder="0" className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                    </div>
                </div>

                {/* Diskon */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diskon (%)</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={discountPercent}
                            onChange={(e) => {
                                const val = Math.min(99, Math.max(0, parseInt(e.target.value) || 0));
                                setDiscountPercent(val);
                            }}
                            min="0"
                            max="99"
                            placeholder="0"
                            className="w-24 border border-gray-300 p-3 rounded-lg text-center focus:ring-2 focus:ring-black outline-none"
                        />
                        <span className="text-gray-500 text-sm">%</span>
                        {discountPercent > 0 && (
                            <span className="text-green-600 text-sm font-medium">
                                Harga diskon: Rp {Math.round(price * (100 - discountPercent) / 100).toLocaleString('id-ID')}
                            </span>
                        )}
                    </div>
                </div>


                {/* Deskripsi */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi <span className="text-red-500">*</span></label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows="4"
                        placeholder="Jelaskan bahan, cuttingan, atau instruksi pencucian..."
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none" />
                </div>

                {/* Toggle Mode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Mode Input</label>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setUseVariants(true)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${useVariants ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                            Dengan Varian Warna
                        </button>
                        <button type="button" onClick={() => setUseVariants(false)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${!useVariants ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                            Tanpa Varian
                        </button>
                    </div>
                </div>

                {/* === MODE VARIAN === */}
                {useVariants ? (
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-medium text-gray-700">Varian Warna & Ukuran</label>
                            <button type="button" onClick={addVariant}
                                className="flex items-center gap-1 text-sm font-medium text-black hover:text-gray-700">
                                <Plus className="w-4 h-4" /> Tambah Varian
                            </button>
                        </div>

                        <div className="space-y-4">
                            {variants.map((variant, index) => (
                                <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="text-sm font-semibold">Varian #{index + 1}</h4>
                                        {variants.length > 1 && (
                                            <button type="button" onClick={() => removeVariant(variant.id)} className="text-red-500 hover:text-red-700">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Nama & Hex Warna - RESPONSIVE */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-600 mb-1">Nama Warna <span className="text-red-500">*</span></label>
                                            <input type="text" value={variant.colorName}
                                                onChange={(e) => updateVariant(variant.id, 'colorName', e.target.value)}
                                                placeholder="Contoh: Hitam"
                                                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div className="sm:w-45">
                                            <label className="block text-xs text-gray-600 mb-1">Kode Warna</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={variant.colorHex}
                                                    onChange={(e) => updateVariant(variant.id, 'colorHex', e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border p-0 shrink-0" />
                                                <input type="text" value={variant.colorHex}
                                                    onChange={(e) => updateVariant(variant.id, 'colorHex', e.target.value)}
                                                    className="flex-1 min-w-0 border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ukuran & Stok */}
                                    <div className="mb-3">
                                        <label className="block text-xs text-gray-600 mb-2">Ukuran & Stok <span className="text-red-500">*</span></label>
                                        <div className="space-y-2">
                                            {availableSizes.map(size => {
                                                const sizeData = variant.sizes.find(s => s.size === size);
                                                const isActive = !!sizeData;
                                                const stock = sizeData?.stock ?? 0;
                                                return (
                                                    <div key={size} className="flex items-center gap-3">
                                                        <button type="button"
                                                            onClick={() => toggleSizeForVariant(variant.id, size)}
                                                            className={`px-3 py-1.5 border rounded text-xs font-medium min-w-12 transition-colors ${isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}>
                                                            {size}
                                                        </button>
                                                        {isActive && (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <span className="text-xs text-gray-500">Stok:</span>
                                                                <input type="number" value={stock || ''}
                                                                    onChange={(e) => updateVariantSizeStock(variant.id, size, e.target.value)}
                                                                    onBlur={(e) => { if (e.target.value === '') updateVariantSizeStock(variant.id, size, '0'); }}
                                                                    onFocus={(e) => e.target.select()}
                                                                    min="0" placeholder="0"
                                                                    className={`w-20 border p-1.5 rounded text-sm text-center focus:ring-2 focus:ring-black outline-none ${stock === 0 ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300'}`} />
                                                                <span className="text-xs text-gray-400">pcs</span>
                                                                {stock === 0 && <span className="text-xs text-yellow-600">(kosong)</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {(() => {
                                            const total = variant.sizes.reduce((sum, s) => sum + s.stock, 0);
                                            const active = variant.sizes.filter(s => s.stock > 0);
                                            return (
                                                <div className={`mt-2 p-2 rounded text-xs ${total > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                                    {total > 0 ? `✅ Stok: ${total} pcs (${active.map(s => `${s.size}:${s.stock}`).join(', ')})` : '⚠️ Belum ada stok'}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Foto */}
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-2">Foto (Rasio 3:4) <span className="text-red-500">*</span></label>
                                        <div className="flex flex-wrap gap-3">
                                            {variant.images.map((blob, i) => (
                                                <div key={i} className="relative w-24 aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border group">
                                                    <img src={URL.createObjectURL(blob)} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                        <button type="button" onClick={() => removeVariantImage(variant.id, i)}
                                                            className="bg-white text-black text-xs p-1 rounded-md"><X className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <label className="relative w-24 aspect-3/4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-white cursor-pointer">
                                                <ImagePlus className="w-5 h-5 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-500">Tambah</span>
                                                <input type="file" accept="image/*" onChange={(e) => onFileChange(e, variant.id, false)} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total Keseluruhan */}
                        {(() => {
                            const total = variants.reduce((sum, v) => sum + v.sizes.reduce((ss, s) => ss + s.stock, 0), 0);
                            return (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800"><span className="font-semibold">Total Stok:</span> {total} pcs</p>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    /* === MODE TANPA VARIAN === */
                    <div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Ukuran & Stok <span className="text-red-500">*</span></label>
                            <div className="space-y-2">
                                {availableSizes.map(size => {
                                    const sizeData = generalSizes.find(s => s.size === size);
                                    const isActive = !!sizeData;
                                    const stock = sizeData?.stock ?? 0;
                                    return (
                                        <div key={size} className="flex items-center gap-3">
                                            <button type="button" onClick={() => toggleGeneralSize(size)}
                                                className={`px-3 py-1.5 border rounded text-xs font-medium min-w-12 ${isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-400'}`}>
                                                {size}
                                            </button>
                                            {isActive && (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-xs text-gray-500">Stok:</span>
                                                    <input type="number" value={stock || ''}
                                                        onChange={(e) => updateGeneralSizeStock(size, e.target.value)}
                                                        onBlur={(e) => { if (e.target.value === '') updateGeneralSizeStock(size, '0'); }}
                                                        onFocus={(e) => e.target.select()}
                                                        min="0" placeholder="0"
                                                        className={`w-20 border p-2 rounded text-sm text-center focus:ring-2 focus:ring-black outline-none ${stock === 0 ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-300'}`} />
                                                    <span className="text-xs text-gray-400">pcs</span>
                                                    {stock === 0 && <span className="text-xs text-yellow-600">(kosong)</span>}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {(() => {
                                const total = generalSizes.reduce((sum, s) => sum + s.stock, 0);
                                const active = generalSizes.filter(s => s.stock > 0);
                                return (
                                    <div className={`mt-2 p-2 rounded text-xs ${total > 0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'}`}>
                                        {total > 0 ? `✅ Total: ${total} pcs (${active.map(s => `${s.size}:${s.stock}`).join(', ')})` : '⚠️ Belum ada stok'}
                                    </div>
                                );
                            })()}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Produk <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-3">
                                {generalImages.map((blob, i) => (
                                    <div key={i} className="relative w-28 aspect-3/4 bg-gray-100 rounded-lg overflow-hidden border group">
                                        <img src={URL.createObjectURL(blob)} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                            <button type="button" onClick={() => removeGeneralImage(i)}
                                                className="bg-white text-black text-xs p-2 rounded-md"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <label className="relative w-28 aspect-3/4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-white cursor-pointer">
                                    <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">Tambah Foto</span>
                                    <input type="file" accept="image/*" onChange={(e) => onFileChange(e, null, true)} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <button type="submit" disabled={isLoading}
                    className="mt-6 bg-black text-white font-medium py-3.5 rounded-lg hover:bg-gray-800 flex justify-center items-center gap-2 disabled:opacity-50">
                    {isLoading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
            </form>

            {/* Modals */}
            <AddCategoryModal isOpen={isAddCategoryModalOpen} onClose={() => setIsAddCategoryModalOpen(false)} onCategoryAdded={handleCategoryAdded} />

            {imageSrc && (
                <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
                    <div className="relative w-full h-[65vh]">
                        <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={3 / 4} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                    </div>
                    <div className="p-6 bg-white w-full max-w-md mt-6 rounded-2xl shadow-2xl flex flex-col gap-5">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Zoom Foto</label>
                            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-black" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => { setImageSrc(null); setActiveVariantId(null); setIsGeneralImage(false); }}
                                className="flex-1 py-3 border rounded-lg hover:bg-gray-50">Batal</button>
                            <button type="button" onClick={showCroppedImage}
                                className="flex-1 py-3 bg-black text-white rounded-lg hover:bg-gray-800">Krop & Pakai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}