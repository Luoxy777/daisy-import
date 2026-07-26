// src/utils/checkout.js
import { supabase } from '../supabaseClient';

export const handleWhatsAppCheckout = async (cartItems) => {
    const adminPhone = "6281213142908"; // Ganti dengan nomor WA admin
    let totalPrice = 0;
    let totalSavings = 0;

    // 1. Format Pesan WhatsApp
    let message = `=== ORDER BARU ===\n\nHalo Admin, saya ingin order:\n\n`;

    cartItems.forEach((item, index) => {
        const itemPrice = item.discountedPrice || item.price;
        const subtotal = itemPrice * item.quantity;
        totalPrice += subtotal;

        if (item.discountPercent > 0) {
            totalSavings += (item.price - item.discountedPrice) * item.quantity;
        }

        message += `${index + 1}. *${item.name}*\n`;
        message += `   - Warna: ${item.colorName}\n`;
        message += `   - Ukuran: ${item.size}\n`;
        message += `   - Jumlah: ${item.quantity} pcs\n`;

        if (item.discountPercent > 0) {
            message += `   - Harga: Rp ${itemPrice.toLocaleString('id-ID')} (Diskon ${item.discountPercent}%)\n`;
        } else {
            message += `   - Harga: Rp ${itemPrice.toLocaleString('id-ID')}\n`;
        }

        message += `   - Subtotal: Rp ${subtotal.toLocaleString('id-ID')}\n\n`;
    });

    message += `---\n`;
    message += `TOTAL: Rp ${totalPrice.toLocaleString('id-ID')}\n`;

    if (totalSavings > 0) {
        message += `Hemat: Rp ${totalSavings.toLocaleString('id-ID')}\n`;
    }

    message += `---\n\n`;
    message += `Mohon info:\n`;
    message += `- Ketersediaan stok\n`;
    message += `- Total pembayaran\n`;
    message += `- Estimasi pengiriman\n\n`;
    message += `Terima kasih.`;

    // 2. Arahkan ke WhatsApp
    const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
};