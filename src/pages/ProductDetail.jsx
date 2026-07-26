// src/pages/ProductDetail.jsx
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ShoppingBag, Check, AlertCircle } from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const { addToCart, cartItems } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const [error, setError] = useState('');
    const quantityInputRef = useRef(null);

    useEffect(() => {
        const fetchProduct = async () => {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    category:category_id (name),
                    variants:product_variants (*)
                `)
                .eq('id', id)
                .single();

            if (data && !error) {
                const parsedData = {
                    ...data,
                    // 🔥 Pastiin discount_percent & discounted_price ada
                    discount_percent: data.discount_percent || 0,
                    discounted_price: data.discounted_price || data.price,
                    variants: data.variants?.map(v => ({
                        ...v,
                        sizes: typeof v.sizes === 'string' ? JSON.parse(v.sizes) : v.sizes
                    }))
                };
                console.log('📦 Product loaded:', {
                    name: parsedData.name,
                    price: parsedData.price,
                    discount_percent: parsedData.discount_percent,
                    discounted_price: parsedData.discounted_price
                });
                setProduct(parsedData);
                if (parsedData.variants?.length > 0) {
                    setSelectedVariant(parsedData.variants[0]);
                }
            }
            setLoading(false);
        };
        fetchProduct();
    }, [id]);

    const getDBStock = (variant, size) => {
        if (!variant?.sizes || !size) return 0;
        const sizeData = variant.sizes.find(s => s.size === size);
        return sizeData?.stock || 0;
    };

    const getCartQuantity = (variantId, size) => {
        if (!product || !variantId || !size) return 0;
        const cartItem = cartItems.find(item =>
            item.productId === product.id &&
            item.variantId === variantId &&
            item.size === size
        );
        return cartItem?.quantity || 0;
    };

    const getAvailableStock = (variant, size) => {
        const dbStock = getDBStock(variant, size);
        const cartQty = getCartQuantity(variant?.id, size);
        return Math.max(0, dbStock - cartQty);
    };

    const availableStock = getAvailableStock(selectedVariant, selectedSize);

    useEffect(() => {
        setQuantity(1);
        setError('');
    }, [selectedVariant?.id, selectedSize]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 animate-pulse">Memuat produk...</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <p className="text-gray-500">Produk tidak ditemukan</p>
                <Link to="/" className="text-sm underline">Kembali ke katalog</Link>
            </div>
        );
    }

    const handleQuantityChange = (newVal) => {
        if (newVal === '' || newVal === undefined) { setQuantity(1); return; }
        const parsed = parseInt(newVal);
        if (isNaN(parsed) || parsed < 1) { setQuantity(1); return; }
        if (parsed > availableStock) {
            setQuantity(availableStock);
            setError(`Maksimal ${availableStock} item!`);
            setTimeout(() => setError(''), 3000);
            return;
        }
        setQuantity(parsed);
    };

    const handleAddToCart = () => {
        setError('');

        if (!selectedVariant) { setError('Pilih warna terlebih dahulu!'); return; }
        if (!selectedSize) { setError('Pilih ukuran terlebih dahulu!'); return; }

        let requestedQuantity = quantity;
        if (quantityInputRef.current) {
            const inputValue = parseInt(quantityInputRef.current.value);
            if (!isNaN(inputValue) && inputValue > 0) requestedQuantity = inputValue;
        }

        const dbStock = getDBStock(selectedVariant, selectedSize);
        if (dbStock <= 0) { setError('Maaf, stok untuk ukuran ini sedang habis!'); return; }

        const cartQty = getCartQuantity(selectedVariant.id, selectedSize);
        const available = dbStock - cartQty;

        if (available <= 0) {
            setError(`Kamu sudah menambahkan ${cartQty} item ke keranjang (stok total: ${dbStock}).`);
            return;
        }
        if (requestedQuantity > available) {
            setError(`Stok tidak cukup! Tersedia: ${available} item.`);
            setQuantity(1);
            if (quantityInputRef.current) quantityInputRef.current.value = 1;
            return;
        }

        // 🔥 KIRIM PRODUCT DENGAN DISKON
        console.log('🛒 Adding to cart:', {
            productName: product.name,
            price: product.price,
            discount_percent: product.discount_percent,
            discounted_price: product.discounted_price
        });

        const result = addToCart(product, selectedVariant, selectedSize, requestedQuantity);

        if (!result.success) {
            setError(result.error);
            return;
        }

        setAddedToCart(true);
        setQuantity(1);
        if (quantityInputRef.current) quantityInputRef.current.value = 1;
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const variantSizes = selectedVariant?.sizes || [];
    const hasDiscount = (product.discount_percent || 0) > 0;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-2">
                <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm -mx-4 px-4 py-3 mb-6 border-b">
                    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-black">
                        <ChevronLeft className="w-5 h-5" />
                        Kembali ke Katalog
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-8 md:gap-16">
                    {/* Product Images */}
                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                            <img src={selectedVariant?.image_urls?.[0] || product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        {selectedVariant?.image_urls?.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {selectedVariant.image_urls.map((url, idx) => (
                                    <div key={idx} className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">{product.category?.name}</p>
                            <h1 className="text-2xl md:text-3xl font-medium text-gray-900">{product.name}</h1>

                            {/* 🔥 HARGA DENGAN DISKON */}
                            <div className="flex items-center gap-3 mt-2">
                                {hasDiscount ? (
                                    <>
                                        <p className="text-2xl font-bold text-red-500">
                                            Rp {product.discounted_price?.toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-lg text-gray-400 line-through">
                                            Rp {product.price?.toLocaleString('id-ID')}
                                        </p>
                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                                            -{product.discount_percent}%
                                        </span>
                                    </>
                                ) : (
                                    <p className="text-xl font-semibold">Rp {product.price?.toLocaleString('id-ID')}</p>
                                )}
                            </div>
                        </div>

                        {product.description && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-2">Deskripsi</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
                            </div>
                        )}

                        {/* Color Selection */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Warna: {selectedVariant?.color_name || 'Pilih'}</h3>
                            <div className="flex gap-3">
                                {product.variants?.map((variant) => {
                                    const totalStock = variant.sizes?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;
                                    return (
                                        <button key={variant.id}
                                            onClick={() => { setSelectedVariant(variant); setSelectedSize(null); setError(''); }}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${selectedVariant?.id === variant.id ? 'border-black scale-110' : 'border-gray-300 hover:border-gray-500'} ${totalStock <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            style={{ backgroundColor: variant.color_hex }}
                                            title={`${variant.color_name}${totalStock <= 0 ? ' (Habis)' : ''}`}
                                            disabled={totalStock <= 0} />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Size Selection */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-3">Ukuran</h3>
                            {variantSizes.length > 0 ? (
                                <div className="flex gap-2 flex-wrap">
                                    {variantSizes.map((s) => {
                                        const dbStock = s.stock || 0;
                                        const inCart = getCartQuantity(selectedVariant?.id, s.size);
                                        const available = Math.max(0, dbStock - inCart);
                                        return (
                                            <button key={s.size}
                                                onClick={() => { setSelectedSize(s.size); setError(''); }}
                                                className={`px-4 py-3 border rounded-md text-sm font-medium min-w-[60px] ${selectedSize === s.size ? 'bg-black text-white border-black' : available <= 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-300 hover:border-black'}`}
                                                disabled={available <= 0}>
                                                <div>{s.size}</div>
                                                <div className="text-xs mt-0.5 opacity-70">{dbStock <= 0 ? 'Habis' : available <= 0 ? 'Penuh' : `${available}`}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : <p className="text-sm text-gray-400">Pilih warna dulu</p>}
                        </div>

                        {/* Quantity */}
                        {selectedVariant && selectedSize && availableStock > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-900 mb-3">Jumlah</h3>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleQuantityChange(quantity - 1)} className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50" disabled={quantity <= 1}>-</button>
                                    <input ref={quantityInputRef} type="number" value={quantity}
                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (isNaN(val) || val < 1) { setQuantity(1); e.target.value = 1; }
                                            else if (val > availableStock) { setQuantity(availableStock); e.target.value = availableStock; setError(`Maksimal ${availableStock} item!`); setTimeout(() => setError(''), 3000); }
                                        }}
                                        min="1" max={availableStock}
                                        className="w-16 text-center font-medium text-lg border border-gray-300 rounded-lg py-2 focus:ring-2 focus:ring-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    <button onClick={() => handleQuantityChange(quantity + 1)} className="w-10 h-10 border rounded-lg flex items-center justify-center hover:bg-gray-50 disabled:opacity-50" disabled={quantity >= availableStock}>+</button>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Tersedia: {availableStock} item</p>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        <button onClick={handleAddToCart}
                            disabled={!selectedVariant || !selectedSize || availableStock <= 0}
                            className="w-full bg-black text-white font-medium py-4 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {addedToCart ? <><Check className="w-5 h-5" /> Berhasil Ditambahkan!</> :
                                availableStock <= 0 && selectedVariant && selectedSize ? <><AlertCircle className="w-5 h-5" /> Stok Habis</> :
                                    <><ShoppingBag className="w-5 h-5" /> Tambahkan ke Keranjang</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}