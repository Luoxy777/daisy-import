// src/pages/Cart.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../supabaseClient';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, AlertCircle, Loader, Check, Tag, User, Phone, MapPin, Mail } from 'lucide-react';

export default function Cart() {
    const { cartItems, removeFromCart, updateQuantity, totalPrice, totalSavings, clearCart, session, customer } = useCart();
    const [checkingStock, setCheckingStock] = useState(false);
    const [stockErrors, setStockErrors] = useState([]);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);

    // Customer form
    const [custName, setCustName] = useState('');
    const [custEmail, setCustEmail] = useState('');
    const [custPhone, setCustPhone] = useState('');
    const [custAddress, setCustAddress] = useState('');

    useEffect(() => {
        if (customer) {
            setCustName(customer.full_name || '');
            setCustPhone(customer.phone || '');
            setCustAddress(customer.address || '');
        }
        if (session?.user?.email) {
            setCustEmail(session.user.email);
        }
    }, [customer, session]);

    // ===== QUANTITY HANDLER =====
    const handleUpdateQty = async (item, delta) => {
        const newQty = item.quantity + delta;
        const result = await updateQuantity(
            item.productId, item.variantId, item.size, newQty, item.cartItemId
        );
        if (result && !result.success) {
            alert(result.error);
        }
    };

    // ===== CHECKOUT =====
    const handleCheckout = async () => {
        if (cartItems.length === 0) return;

        if (!custName.trim()) return alert('Nama harus diisi!');
        if (!custPhone.trim()) return alert('No. HP harus diisi!');
        if (!custAddress.trim()) return alert('Alamat harus diisi!');

        setCheckingStock(true);
        setStockErrors([]);

        try {
            // 1. Validasi stok
            for (const item of cartItems) {
                const { data: variant } = await supabase
                    .from('product_variants').select('*').eq('id', item.variantId).single();

                let sizes = typeof variant.sizes === 'string' ? JSON.parse(variant.sizes) : variant.sizes;
                const sizeData = sizes?.find(s => s.size === item.size);
                const currentStock = sizeData?.stock || 0;

                if (currentStock < item.quantity) {
                    setStockErrors([`Stok ${item.name} (${item.colorName}, ${item.size}) tidak cukup! Tersedia: ${currentStock}`]);
                    setCheckingStock(false);
                    return;
                }
            }

            // 2. Kurangi stok
            for (const item of cartItems) {
                const { data: variant } = await supabase.from('product_variants').select('*').eq('id', item.variantId).single();
                let sizes = typeof variant.sizes === 'string' ? JSON.parse(variant.sizes) : variant.sizes;
                const sizeIndex = sizes.findIndex(s => s.size === item.size);
                if (sizeIndex !== -1) {
                    sizes[sizeIndex].stock -= item.quantity;
                    await supabase.from('product_variants').update({ sizes }).eq('id', item.variantId);

                    // Update total stock produk
                    const { data: allVariants } = await supabase.from('product_variants').select('sizes').eq('product_id', item.productId);
                    const totalStock = allVariants?.reduce((sum, v) => {
                        const vSizes = typeof v.sizes === 'string' ? JSON.parse(v.sizes) : v.sizes;
                        return sum + (vSizes?.reduce((s, sz) => s + (sz.stock || 0), 0) || 0);
                    }, 0) || 0;
                    await supabase.from('products').update({ stock: totalStock }).eq('id', item.productId);
                }
            }

            // 3. Simpan order ke DB (kalau login)
            let orderId = null;
            if (session && customer) {
                const { data: order } = await supabase.from('orders').insert({
                    customer_id: customer.id,
                    total_price: totalPrice,
                    status: 'pending',
                    customer_name: custName,
                    customer_phone: custPhone,
                    customer_email: custEmail,
                    shipping_address: custAddress
                }).select().single();

                if (order) {
                    orderId = order.id;
                    const orderItems = cartItems.map(item => ({
                        order_id: order.id,
                        product_id: item.productId,
                        variant_id: item.variantId,
                        product_name: item.name,
                        color_name: item.colorName,
                        size: item.size,
                        price: item.discountedPrice || item.price,
                        quantity: item.quantity,
                        subtotal: (item.discountedPrice || item.price) * item.quantity
                    }));
                    await supabase.from('order_items').insert(orderItems);
                }
            }

            // 4. WhatsApp
            const adminPhone = "6281213142908";
            let message = `=== ORDER BARU ===\n\n`;
            message += `[DATA PEMESAN]\n`;
            message += `Nama    : ${custName}\n`;
            message += `Telp    : ${custPhone}\n`;
            message += `Email   : ${custEmail || '-'}\n`;
            message += `Alamat  : ${custAddress}\n`;
            if (orderId) message += `Order ID: ${orderId.toString().slice(0, 8)}\n`;
            message += `\n---\n\n[PESANAN]\n\n`;

            cartItems.forEach((item, i) => {
                const itemPrice = item.discountedPrice || item.price;
                const subtotal = itemPrice * item.quantity;
                message += `${i + 1}. *${item.name}*\n`;
                message += `   - Warna   : ${item.colorName}\n`;
                message += `   - Ukuran  : ${item.size}\n`;
                message += `   - Jumlah  : ${item.quantity} pcs\n`;
                message += `   - Harga   : Rp ${itemPrice.toLocaleString('id-ID')}`;
                if (item.discountPercent > 0) message += ` (Diskon ${item.discountPercent}%)`;
                message += `\n   - Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
            });

            message += `---\n`;
            message += `TOTAL   : Rp ${totalPrice.toLocaleString('id-ID')}\n`;
            if (totalSavings > 0) message += `Hemat   : Rp ${totalSavings.toLocaleString('id-ID')}\n`;
            message += `---\n\nMohon segera diproses. Terima kasih.`;

            window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');

            setTimeout(() => {
                clearCart();
                setCheckoutSuccess(true);
            }, 500);

        } catch (error) {
            console.error('Checkout error:', error);
            setStockErrors(['Terjadi kesalahan. Coba lagi.']);
        } finally {
            setCheckingStock(false);
        }
    };

    // ===== RENDER =====

    if (checkoutSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Pesanan Terkirim!</h2>
                    <p className="text-gray-500 mb-4">Admin akan menghubungi kamu di WhatsApp</p>
                    <Link to="/" className="text-sm text-black underline">Kembali Belanja</Link>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>
                    <div className="text-center py-20">
                        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">Keranjang belanja kosong</p>
                        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-black hover:underline">
                            <ArrowLeft className="w-4 h-4" /> Lanjutkan Belanja
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Keranjang Belanja</h1>

                <div className="space-y-6">
                    {/* Stock Errors */}
                    {stockErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-800 mb-2">Stok Tidak Mencukupi!</h3>
                                    <ul className="space-y-2">
                                        {stockErrors.map((err, i) => <li key={i} className="text-sm text-red-600">{err}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer Form */}
                    <div className="bg-white rounded-lg p-6 border">
                        <h3 className="font-semibold text-gray-900 mb-4">Data Pemesan</h3>
                        {!session && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                <Link to="/login" className="font-bold underline">Login/Register</Link> untuk menyimpan data otomatis dan riwayat pesanan.
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Nama *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input type="text" value={custName} onChange={(e) => setCustName(e.target.value)}
                                        placeholder="Nama lengkap" required
                                        className="w-full pl-10 border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">No. HP *</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input type="tel" value={custPhone} onChange={(e) => setCustPhone(e.target.value)}
                                        placeholder="0812xxxxxxxx" required
                                        className="w-full pl-10 border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        className="w-full pl-10 border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none" />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">Alamat Lengkap *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <textarea value={custAddress} onChange={(e) => setCustAddress(e.target.value)}
                                        placeholder="Alamat lengkap untuk pengiriman" rows="2" required
                                        className="w-full pl-10 border border-gray-300 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-black outline-none resize-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cart Items */}
                    <div className="space-y-4">
                        {cartItems.map((item) => {
                            const itemPrice = item.discountedPrice || item.price;
                            const subtotal = itemPrice * item.quantity;
                            return (
                                <div key={`${item.productId}-${item.variantId}-${item.size}`} className="bg-white rounded-lg p-4 flex gap-4">
                                    <div className="w-24 h-32 shrink-0 bg-gray-100 rounded overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                                                <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                                                    <p>- Warna: {item.colorName}</p>
                                                    <p>- Ukuran: {item.size}</p>
                                                    {item.discountPercent > 0 ? (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="text-red-500 font-semibold">Rp {item.discountedPrice.toLocaleString('id-ID')}</span>
                                                            <span className="text-xs text-gray-400 line-through">Rp {item.price.toLocaleString('id-ID')}</span>
                                                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">-{item.discountPercent}%</span>
                                                        </div>
                                                    ) : (
                                                        <p>Rp {item.price.toLocaleString('id-ID')}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromCart(item.productId, item.variantId, item.size, item.cartItemId)}
                                                className="text-gray-400 hover:text-red-500 shrink-0 ml-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleUpdateQty(item, -1)}
                                                    className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                                                    disabled={item.quantity <= 1}>
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQty(item, 1)}
                                                    className="w-8 h-8 border rounded flex items-center justify-center hover:bg-gray-50 disabled:opacity-30"
                                                    disabled={item.quantity >= item.maxStock}>
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">Rp {subtotal.toLocaleString('id-ID')}</p>
                                                {item.discountPercent > 0 && (
                                                    <p className="text-xs text-green-600">Hemat Rp {((item.price - item.discountedPrice) * item.quantity).toLocaleString('id-ID')}</p>
                                                )}
                                            </div>
                                        </div>
                                        {item.quantity >= item.maxStock && (
                                            <p className="text-xs text-orange-500 mt-1">Stok maksimal</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    <div className="bg-white rounded-lg p-6 sticky bottom-0 shadow-lg">
                        <div className="space-y-2 mb-4 pb-4 border-b">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} item)</span>
                                <span>Rp {cartItems.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString('id-ID')}</span>
                            </div>
                            {totalSavings > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Diskon</span>
                                    <span>-Rp {totalSavings.toLocaleString('id-ID')}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold">Total</span>
                            <span className="text-xl font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                        {totalSavings > 0 && (
                            <div className="mb-4 p-2 bg-green-50 rounded-lg text-center text-sm text-green-700">
                                Kamu hemat <span className="font-bold">Rp {totalSavings.toLocaleString('id-ID')}</span>!
                            </div>
                        )}
                        <button onClick={handleCheckout} disabled={checkingStock}
                            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-lg shadow-lg active:scale-[0.98]">
                            {checkingStock ? <><Loader className="w-5 h-5 animate-spin" /> Memproses...</> :
                                <><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg> Pesan via WhatsApp</>
                            }
                        </button>
                        <Link to="/" className="block text-center mt-3 text-sm text-gray-500 hover:text-black">Lanjutkan Belanja</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}