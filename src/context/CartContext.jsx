// src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const CartContext = createContext();

const getGuestId = () => {
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
        guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(7);
        localStorage.setItem('guest_id', guestId);
    }
    return guestId;
};

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [session, setSession] = useState(null);
    const [customer, setCustomer] = useState(null);

    // Load cart dari DB (user) atau localStorage (guest)
    const loadCart = useCallback(async (userId) => {
        if (userId) {
            // Ambil dari DB
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (data && !error) {
                setCartItems(data.map(item => ({
                    productId: item.product_id,
                    variantId: item.variant_id,
                    name: item.product_name,
                    price: item.price,
                    discountedPrice: item.discounted_price,
                    discountPercent: item.discount_percent,
                    colorName: item.color_name,
                    colorHex: item.color_hex,
                    image: item.image_url,
                    size: item.size,
                    quantity: item.quantity,
                    maxStock: item.max_stock,
                    cartItemId: item.id // untuk update/delete
                })));
            } else {
                setCartItems([]);
            }
        } else {
            // Guest: localStorage
            const key = `cart_${getGuestId()}`;
            const saved = localStorage.getItem(key);
            setCartItems(saved ? JSON.parse(saved) : []);
        }
    }, []);

    // Merge guest cart ke user cart (after login)
    const mergeGuestCart = async (userId) => {
        const guestKey = `cart_${getGuestId()}`;
        const guestCart = JSON.parse(localStorage.getItem(guestKey) || '[]');

        if (guestCart.length > 0) {
            // Ambil existing user cart dari DB
            const { data: existingCart } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId);

            for (const guestItem of guestCart) {
                // Cek apakah item sama sudah ada di DB
                const exists = existingCart?.find(item =>
                    item.product_id === guestItem.productId &&
                    item.variant_id === guestItem.variantId &&
                    item.size === guestItem.size
                );

                if (exists) {
                    // Update quantity
                    const newQty = Math.min(exists.quantity + guestItem.quantity, guestItem.maxStock);
                    await supabase.from('cart_items')
                        .update({ quantity: newQty, max_stock: guestItem.maxStock })
                        .eq('id', exists.id);
                } else {
                    // Insert new
                    await supabase.from('cart_items').insert({
                        user_id: userId,
                        product_id: guestItem.productId,
                        variant_id: guestItem.variantId,
                        product_name: guestItem.name,
                        color_name: guestItem.colorName,
                        color_hex: guestItem.colorHex,
                        size: guestItem.size,
                        price: guestItem.price,
                        discounted_price: guestItem.discountedPrice,
                        discount_percent: guestItem.discountPercent,
                        image_url: guestItem.image,
                        quantity: guestItem.quantity,
                        max_stock: guestItem.maxStock
                    });
                }
            }

            // Hapus guest cart
            localStorage.removeItem(guestKey);
        }

        // Load cart from DB
        loadCart(userId);
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                loadCustomer(session.user.id);
                mergeGuestCart(session.user.id);
            } else {
                loadCart(null);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                loadCustomer(session.user.id);
                mergeGuestCart(session.user.id);
            } else {
                setCustomer(null);
                loadCart(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadCustomer = async (userId) => {
        const { data } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', userId)
            .single();
        setCustomer(data);
    };

    // ===== CRUD CART =====

    const addToCart = async (product, variant, size, quantity = 1) => {
        const sizes = typeof variant.sizes === 'string' ? JSON.parse(variant.sizes) : variant.sizes;
        const sizeData = sizes?.find(s => s.size === size);
        const maxStock = sizeData?.stock || 0;
        const discountPercent = product.discount_percent || 0;
        const discountedPrice = discountPercent > 0
            ? Math.round(product.price * (100 - discountPercent) / 100) : product.price;

        if (quantity > maxStock) {
            return { success: false, error: `Stok tidak cukup! Tersedia: ${maxStock}`, maxStock };
        }

        const userId = session?.user?.id;

        if (userId) {
            // SAVE KE DATABASE
            const { data: existing } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId)
                .eq('product_id', product.id)
                .eq('variant_id', variant.id)
                .eq('size', size)
                .single();

            if (existing) {
                const newQty = existing.quantity + quantity;
                if (newQty > maxStock) {
                    return { success: false, error: `Stok tidak cukup! Maksimal ${maxStock} item.`, maxStock };
                }
                await supabase.from('cart_items')
                    .update({ quantity: newQty, max_stock: maxStock })
                    .eq('id', existing.id);
            } else {
                await supabase.from('cart_items').insert({
                    user_id: userId,
                    product_id: product.id,
                    variant_id: variant.id,
                    product_name: product.name,
                    color_name: variant.color_name || variant.colorName,
                    color_hex: variant.color_hex || variant.colorHex,
                    size,
                    price: product.price,
                    discounted_price: discountedPrice,
                    discount_percent: discountPercent,
                    image_url: variant.image_urls?.[0] || product.image_url,
                    quantity,
                    max_stock: maxStock
                });
            }

            await loadCart(userId);
        } else {
            // GUEST: localStorage
            let isUpdated = false;
            setCartItems(prev => {
                const existingIndex = prev.findIndex(item =>
                    item.productId === product.id && item.variantId === variant.id && item.size === size
                );
                let newItems;
                if (existingIndex > -1) {
                    const newQty = prev[existingIndex].quantity + quantity;
                    if (newQty > maxStock) { isUpdated = false; return prev; }
                    isUpdated = true;
                    newItems = [...prev];
                    newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQty };
                } else {
                    isUpdated = true;
                    newItems = [...prev, {
                        productId: product.id, variantId: variant.id, name: product.name,
                        price: product.price, discountedPrice, discountPercent,
                        colorName: variant.color_name || variant.colorName,
                        colorHex: variant.color_hex || variant.colorHex,
                        image: variant.image_urls?.[0] || product.image_url,
                        size, quantity, maxStock
                    }];
                }
                localStorage.setItem(`cart_${getGuestId()}`, JSON.stringify(newItems));
                return newItems;
            });

            if (!isUpdated) {
                return { success: false, error: `Stok tidak cukup! Maksimal ${maxStock} item.`, maxStock };
            }
        }

        return { success: true };
    };

    const removeFromCart = async (productId, variantId, size, cartItemId) => {
        const userId = session?.user?.id;

        if (userId && cartItemId) {
            await supabase.from('cart_items').delete().eq('id', cartItemId);
            await loadCart(userId);
        } else {
            setCartItems(prev => {
                const newItems = prev.filter(item =>
                    !(item.productId === productId && item.variantId === variantId && item.size === size)
                );
                localStorage.setItem(`cart_${getGuestId()}`, JSON.stringify(newItems));
                return newItems;
            });
        }
    };

    const updateQuantity = async (productId, variantId, size, newQuantity, cartItemId) => {
        if (newQuantity < 1) {
            removeFromCart(productId, variantId, size, cartItemId);
            return { success: true };
        }

        const userId = session?.user?.id;

        if (userId && cartItemId) {
            const { data: item } = await supabase.from('cart_items').select('max_stock').eq('id', cartItemId).single();
            if (item && newQuantity > item.max_stock) {
                return { success: false, error: `Maksimal ${item.max_stock} item!` };
            }
            await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', cartItemId);
            await loadCart(userId);
        } else {
            let isValid = true;
            setCartItems(prev => {
                const item = prev.find(i => i.productId === productId && i.variantId === variantId && i.size === size);
                if (!item || newQuantity > item.maxStock) { isValid = false; return prev; }
                const newItems = prev.map(i =>
                    i.productId === productId && i.variantId === variantId && i.size === size
                        ? { ...i, quantity: newQuantity } : i
                );
                localStorage.setItem(`cart_${getGuestId()}`, JSON.stringify(newItems));
                return newItems;
            });
            if (!isValid) return { success: false, error: 'Stok tidak cukup!' };
        }

        return { success: true };
    };

    const clearCart = async () => {
        const userId = session?.user?.id;
        if (userId) {
            await supabase.from('cart_items').delete().eq('user_id', userId);
            await loadCart(userId);
        } else {
            setCartItems([]);
            localStorage.removeItem(`cart_${getGuestId()}`);
        }
    };

    const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = cartItems.reduce((sum, i) => sum + ((i.discountedPrice || i.price) * i.quantity), 0);
    const totalSavings = cartItems.reduce((sum, i) => {
        if (i.discountPercent > 0) return sum + ((i.price - i.discountedPrice) * i.quantity);
        return sum;
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, removeFromCart, updateQuantity, clearCart,
            totalItems, totalPrice, totalSavings, session, customer
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}