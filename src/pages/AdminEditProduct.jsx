// src/pages/AdminEditProduct.jsx
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { ChevronDown, ImagePlus, X, Plus, Trash2, LogOut, ArrowLeft, Save } from 'lucide-react';
import getCroppedImg from '../utils/cropImage';
import { supabase } from '../supabaseClient';

export default function AdminEditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [discountPercent, setDiscountPercent] = useState(0);
    const [categoryId, setCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [useVariants, setUseVariants] = useState(true);
    const [generalImages, setGeneralImages] = useState([]);
    const [generalSizes, setGeneralSizes] = useState([]);
    const [variants, setVariants] = useState([]);
    const availableSizes = ['S', 'M', 'L', 'XL', 'All Size'];

    // Image crop states
    const [activeVariantId, setActiveVariantId] = useState(null);
    const [isGeneralImage, setIsGeneralImage] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    // Existing image URLs (from DB)
    const [generalImageUrls, setGeneralImageUrls] = useState([]);
    const [variantImageUrls, setVariantImageUrls] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            // Fetch categories
            const { data: catData } = await supabase.from('categories').select('*').order('name');
            if (catData) setCategories(catData);

            // Fetch product with variants
            const { data: product } = await supabase
                .from('products')
                .select('*, variants:product_variants(*)')
                .eq('id', id)
                .single();

            if (product) {
                setName(product.name);
                setPrice(product.price);
                setDiscountPercent(product.discount_percent || 0);
                setCategoryId(product.category_id);
                setDescription(product.description || '');
                setIsActive(product.is_active !== false);

                if (product.variants?.length > 0) {
                    setUseVariants(true);

                    // Parse variants
                    const parsedVariants = product.variants.map(v => ({
                        id: v.id,
                        colorName: v.color_name,
                        colorHex: v.color_hex,
                        images: [], // Untuk gambar baru (blob)
                        existingImages: v.image_urls || [], // URL gambar existing
                        sizes: typeof v.sizes === 'string' ? JSON.parse(v.sizes) : (v.sizes || [])
                    }));
                    setVariants(parsedVariants);
                } else {
                    // No variants = mode tanpa varian
                    setUseVariants(false);
                    setGeneralImageUrls(product.image_url ? [product.image_url] : []);
                    setGeneralSizes([]);
                }
            }

            setIsLoading(false);
        };
        fetchData();
    }, [id]);

    // Size management (sama kaya Admin.jsx)
    const toggleSizeForVariant = (variantId, size) => {
        setVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v;
            const exists = v.sizes.find(s => s.size === size);
            if (exists) return { ...v, sizes: v.sizes.filter(s => s.size !== size) };
            return { ...v, sizes: [...v.sizes, { size, stock: 0 }] };
        }));
    };

    const updateVariantSizeStock = (variantId, size, value) => {
        const stock = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
        setVariants(prev => prev.map(v => {
            if (v.id !== variantId) return v;
            return { ...v, sizes: v.sizes.map(s => s.size === size ? { ...s, stock } : s) };
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

    const addVariant = () => {
        setVariants(prev => [...prev, {
            id: 'new-' + Date.now().toString(),
            colorName: '',
            colorHex: '#000000',
            images: [],
            existingImages: [],
            sizes: []
        }]);
    };

    const removeVariant = async (variantId) => {
        if (!confirm('Hapus varian ini?')) return;

        // Kalau variant existing (ada di DB), hapus dari DB
        if (!variantId.toString().startsWith('new-')) {
            await supabase.from('product_variants').delete().eq('id', variantId);
        }

        setVariants(prev => prev.filter(v => v.id !== variantId));
    };

    const updateVariant = (id, field, value) => {
        setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
    };

    // Remove existing image (from DB)
    const removeExistingVariantImage = (variantId, imageUrl) => {
        setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                return { ...v, existingImages: v.existingImages.filter(url => url !== imageUrl) };
            }
            return v;
        }));
    };

    const removeExistingGeneralImage = (imageUrl) => {
        setGeneralImageUrls(prev => prev.filter(url => url !== imageUrl));
    };

    // Image crop (sama kaya Admin.jsx)
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

    // SUBMIT EDIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = [];

        if (!name.trim()) errors.push('• Nama produk harus diisi');
        if (!categoryId) errors.push('• Pilih kategori');
        if (!price || Number(price) <= 0) errors.push('• Harga harus > 0');

        if (useVariants) {
            if (variants.length === 0) {
                errors.push('• Tambahkan minimal 1 varian');
            } else {
                variants.forEach((v, i) => {
                    if (!v.colorName.trim()) errors.push(`• Varian #${i + 1}: Nama warna harus diisi`);
                    const totalImages = (v.existingImages?.length || 0) + (v.images?.length || 0);
                    if (totalImages === 0) errors.push(`• Varian #${i + 1}: Minimal 1 foto`);
                    const totalStock = v.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
                    if (totalStock <= 0) errors.push(`• Varian #${i + 1}: Minimal 1 ukuran harus ada stoknya`);
                });
            }
        } else {
            const totalImages = generalImageUrls.length + generalImages.length;
            if (totalImages === 0) errors.push('• Minimal 1 foto produk');
            const totalStock = generalSizes.reduce((sum, s) => sum + (s.stock || 0), 0);
            if (totalStock <= 0) errors.push('• Minimal 1 ukuran harus ada stoknya');
        }

        if (errors.length > 0) {
            alert('Mohon lengkapi:\n\n' + errors.join('\n'));
            return;
        }

        setIsSaving(true);

        try {
            const options = { maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true };

            if (useVariants) {
                const variantsData = [];

                for (const variant of variants) {
                    // Upload new images
                    const newUploadedUrls = [];
                    for (const image of variant.images) {
                        const compressedFile = await imageCompression(image, options);
                        const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                        await supabase.storage.from('product-images').upload(fileName, compressedFile);
                        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
                        newUploadedUrls.push(publicUrl);
                    }

                    // Gabung existing + new images
                    const allImages = [...(variant.existingImages || []), ...newUploadedUrls];
                    const sizesData = variant.sizes.map(s => ({ size: s.size, stock: s.stock || 0 }));

                    variantsData.push({
                        id: variant.id.toString().startsWith('new-') ? null : variant.id,
                        colorName: variant.colorName,
                        colorHex: variant.colorHex,
                        imageUrls: allImages,
                        sizes: sizesData
                    });
                }

                // Update product
                const totalStock = variantsData.reduce((sum, v) => sum + v.sizes.reduce((ss, s) => ss + s.stock, 0), 0);
                const mainImage = variantsData[0].imageUrls[0];

                await supabase.from('products')
                    .update({
                        name: name.trim(),
                        category_id: categoryId,
                        price: Number(price),
                        discount_percent: discountPercent,
                        description: description.trim(),
                        image_url: mainImage,
                        stock: totalStock,
                        is_active: isActive
                    })
                    .eq('id', id);

                // Update/Insert variants
                for (const v of variantsData) {
                    const variantPayload = {
                        product_id: id,
                        color_name: v.colorName,
                        color_hex: v.colorHex,
                        image_urls: v.imageUrls,
                        sizes: v.sizes
                    };

                    if (v.id) {
                        // Update existing variant
                        await supabase.from('product_variants').update(variantPayload).eq('id', v.id);
                    } else {
                        // Insert new variant
                        await supabase.from('product_variants').insert(variantPayload);
                    }
                }

                // Delete variants that are removed
                const currentVariantIds = variantsData.filter(v => v.id).map(v => v.id);
                const { data: existingVariants } = await supabase.from('product_variants').select('id').eq('product_id', id);
                if (existingVariants) {
                    for (const ev of existingVariants) {
                        if (!currentVariantIds.includes(ev.id)) {
                            await supabase.from('product_variants').delete().eq('id', ev.id);
                        }
                    }
                }

            } else {
                // Mode tanpa varian
                const newUploadedUrls = [];
                for (const image of generalImages) {
                    const compressedFile = await imageCompression(image, options);
                    const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
                    await supabase.storage.from('product-images').upload(fileName, compressedFile);
                    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
                    newUploadedUrls.push(publicUrl);
                }

                const allImages = [...generalImageUrls, ...newUploadedUrls];
                const sizesData = generalSizes.map(s => ({ size: s.size, stock: s.stock || 0 }));
                const totalStock = sizesData.reduce((sum, s) => sum + s.stock, 0);

                await supabase.from('products')
                    .update({
                        name: name.trim(),
                        category_id: categoryId,
                        price: Number(price),
                        discount_percent: discountPercent,
                        description: description.trim(),
                        image_url: allImages[0],
                        stock: totalStock,
                        is_active: isActive
                    })
                    .eq('id', id);

                // Update atau insert variant
                const { data: existingVariant } = await supabase.from('product_variants').select('id').eq('product_id', id).limit(1).single();

                const variantPayload = {
                    product_id: id,
                    color_name: 'Default',
                    color_hex: '#000000',
                    image_urls: allImages,
                    sizes: sizesData
                };

                if (existingVariant) {
                    await supabase.from('product_variants').update(variantPayload).eq('id', existingVariant.id);
                } else {
                    await supabase.from('product_variants').insert(variantPayload);
                }
            }

            alert('✅ Produk berhasil diupdate!');
            navigate('/admin/products');

        } catch (error) {
            console.error('Update error:', error);
            alert('❌ Gagal update: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-8 max-w-3xl mx-auto bg-gray-50 min-h-screen font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link to="/admin/products" className="text-sm text-gray-500 hover:text-black flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-4 h-4" /> Kembali ke daftar produk
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-white p-6 md:p-8 rounded-xl shadow-sm border">

                {/* Nama */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Produk <span className="text-red-500">*</span></label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                </div>

                {/* Kategori */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategori <span className="text-red-500">*</span></label>
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex justify-between items-center border border-gray-300 p-3 rounded-lg bg-white">
                        <span>{categories.find(c => c.id === categoryId)?.name || 'Pilih Kategori'}</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                        <ul className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-xl max-h-60 overflow-auto">
                            {categories.map(cat => (
                                <li key={cat.id} onClick={() => { setCategoryId(cat.id); setIsDropdownOpen(false); }}
                                    className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-50 ${categoryId === cat.id ? 'font-semibold bg-gray-50' : ''}`}>
                                    {cat.name}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Harga */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harga (Rp) <span className="text-red-500">*</span></label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500">Rp</span>
                        <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required
                            className="w-full border border-gray-300 p-3 pl-10 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                    </div>
                </div>

                {/* Diskon */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diskon (%)</label>
                    <div className="flex items-center gap-3">
                        <input type="number" value={discountPercent}
                            onChange={(e) => setDiscountPercent(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                            min="0" max="99" className="w-24 border border-gray-300 p-3 rounded-lg text-center focus:ring-2 focus:ring-black outline-none" />
                        <span className="text-gray-500">%</span>
                        {discountPercent > 0 && price > 0 && (
                            <span className="text-green-600 font-medium text-sm">
                                Harga diskon: Rp {Math.round(price * (100 - discountPercent) / 100).toLocaleString('id-ID')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Status Produk:</label>
                    <button type="button" onClick={() => setIsActive(!isActive)}
                        className={`px-4 py-2 rounded-full text-sm font-bold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {isActive ? '🟢 AKTIF' : '🔴 NONAKTIF'}
                    </button>
                </div>

                {/* Deskripsi */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="4"
                        className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none" />
                </div>

                {/* Toggle Mode */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Mode</label>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                        <button type="button" onClick={() => setUseVariants(true)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${useVariants ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                            Dengan Varian
                        </button>
                        <button type="button" onClick={() => setUseVariants(false)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${!useVariants ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
                            Tanpa Varian
                        </button>
                    </div>
                </div>

                {/* MODE VARIAN */}
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
                                        <button type="button" onClick={() => removeVariant(variant.id)} className="text-red-500 hover:text-red-700">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Nama & Hex Warna - RESPONSIVE */}
                                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                                        <div className="flex-1">
                                            <label className="block text-xs text-gray-600 mb-1">Nama Warna <span className="text-red-500">*</span></label>
                                            <input type="text" value={variant.colorName}
                                                onChange={(e) => updateVariant(variant.id, 'colorName', e.target.value)}
                                                className="w-full border border-gray-300 p-2 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none" />
                                        </div>
                                        <div className="sm:w-[180px]">
                                            <label className="block text-xs text-gray-600 mb-1">Kode Warna</label>
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={variant.colorHex}
                                                    onChange={(e) => updateVariant(variant.id, 'colorHex', e.target.value)}
                                                    className="w-10 h-10 rounded cursor-pointer border p-0 flex-shrink-0" />
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
                                                        <button type="button" onClick={() => toggleSizeForVariant(variant.id, size)}
                                                            className={`px-3 py-1.5 border rounded text-xs font-medium min-w-[48px] ${isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-300'}`}>
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
                                                                    className="w-20 border p-1.5 rounded text-sm text-center focus:ring-2 focus:ring-black outline-none" />
                                                                <span className="text-xs text-gray-400">pcs</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Foto */}
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-2">Foto <span className="text-red-500">*</span></label>
                                        <div className="flex flex-wrap gap-3">
                                            {/* Existing images */}
                                            {(variant.existingImages || []).map((url, i) => (
                                                <div key={'existing-' + i} className="relative w-24 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border group">
                                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                        <button type="button" onClick={() => removeExistingVariantImage(variant.id, url)}
                                                            className="bg-white text-black text-xs p-1 rounded-md"><X className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* New images (blob) */}
                                            {(variant.images || []).map((blob, i) => (
                                                <div key={'new-' + i} className="relative w-24 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border group">
                                                    <img src={URL.createObjectURL(blob)} alt="" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                        <button type="button" onClick={() => removeVariantImage(variant.id, i)}
                                                            className="bg-white text-black text-xs p-1 rounded-md"><X className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <label className="relative w-24 aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-white cursor-pointer">
                                                <ImagePlus className="w-5 h-5 text-gray-400 mb-1" />
                                                <span className="text-xs text-gray-500">Tambah</span>
                                                <input type="file" accept="image/*" onChange={(e) => onFileChange(e, variant.id, false)} className="hidden" />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* MODE TANPA VARIAN */
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
                                                className={`px-3 py-1.5 border rounded text-xs font-medium min-w-[48px] ${isActive ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-300'}`}>
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
                                                        className="w-20 border p-2 rounded text-sm text-center focus:ring-2 focus:ring-black outline-none" />
                                                    <span className="text-xs text-gray-400">pcs</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Produk <span className="text-red-500">*</span></label>
                            <div className="flex flex-wrap gap-3">
                                {/* Existing images */}
                                {generalImageUrls.map((url, i) => (
                                    <div key={'existing-' + i} className="relative w-28 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border group">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                            <button type="button" onClick={() => removeExistingGeneralImage(url)}
                                                className="bg-white text-black text-xs p-2 rounded-md"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {/* New images */}
                                {generalImages.map((blob, i) => (
                                    <div key={'new-' + i} className="relative w-28 aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden border group">
                                        <img src={URL.createObjectURL(blob)} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                            <button type="button" onClick={() => removeGeneralImage(i)}
                                                className="bg-white text-black text-xs p-2 rounded-md"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                <label className="relative w-28 aspect-[3/4] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:bg-white cursor-pointer">
                                    <ImagePlus className="w-6 h-6 text-gray-400 mb-1" />
                                    <span className="text-xs text-gray-500">Tambah</span>
                                    <input type="file" accept="image/*" onChange={(e) => onFileChange(e, null, true)} className="hidden" />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                <button type="submit" disabled={isSaving}
                    className="mt-6 bg-black text-white font-medium py-3.5 rounded-lg hover:bg-gray-800 flex justify-center items-center gap-2 disabled:opacity-50">
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </form>

            {/* Crop Modal */}
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