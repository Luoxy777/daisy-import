// src/components/ProductCard.jsx
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
    const hasDiscount = product.discount_percent > 0;
    const discountedPrice = product.discounted_price ||
        Math.round(product.price * (100 - (product.discount_percent || 0)) / 100);

    return (
        <Link to={`/product/${product.id}`} className="group cursor-pointer flex flex-col gap-2">
            {/* Container Gambar 3:4 */}
            <div className="relative w-full aspect-3/4 overflow-hidden bg-gray-100 rounded-lg">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badge Diskon */}
                {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        -{product.discount_percent}%
                    </div>
                )}

                {/* Overlay Habis */}
                {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <span className="bg-black text-white text-xs px-3 py-1 rounded-full font-bold">
                            SOLD OUT
                        </span>
                    </div>
                )}
            </div>

            {/* Info Produk */}
            <div className="flex flex-col gap-1 mt-2">
                <h3 className="text-sm font-medium text-gray-900 truncate">{product.name}</h3>

                {/* Harga */}
                <div className="flex items-center gap-2 flex-wrap">
                    {hasDiscount ? (
                        <>
                            <span className="text-sm font-semibold text-red-500">
                                Rp {discountedPrice.toLocaleString('id-ID')}
                            </span>
                            <span className="text-xs text-gray-400 line-through">
                                Rp {product.price.toLocaleString('id-ID')}
                            </span>
                        </>
                    ) : (
                        <span className="text-sm text-gray-500">
                            Rp {product.price.toLocaleString('id-ID')}
                        </span>
                    )}
                </div>

                {/* Pilihan Warna - hanya tampil kalau ada */}
                {product.variants && product.variants.some(v => v.color_hex) && (
                    <div className="flex gap-1.5 mt-1">
                        {product.variants.filter(v => v.color_hex).slice(0, 5).map((variant, idx) => (
                            <div
                                key={idx}
                                className="w-4 h-4 rounded-full border border-gray-300"
                                style={{ backgroundColor: variant.color_hex }}
                                title={variant.color_name}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}