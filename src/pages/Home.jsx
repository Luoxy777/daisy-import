// src/pages/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, X } from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All Items');
    const [categories, setCategories] = useState(['All Items']);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (categoriesData) {
            setCategories(['All Items', ...categoriesData.map(c => c.name)]);
        }

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                category:category_id (name),
                variants:product_variants (*)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    // Filter + Search
    const filteredProducts = products.filter(product => {
        const matchCategory = activeCategory === 'All Items' || product.category?.name === activeCategory;
        const matchSearch = !searchQuery ||
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Header dengan Search */}
            <div className="sticky top-16 z-40 bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Kategori Scroll */}
                        <div className="flex gap-2 overflow-x-auto flex-1 scrollbar-hide">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-medium transition-colors ${activeCategory === cat
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="p-2 hover:bg-gray-100 rounded-full shrink-0"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    {showSearch && (
                        <div className="mt-3 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari produk..."
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm focus:ring-2 focus:ring-black outline-none"
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Product Grid */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <p className="text-gray-500 animate-pulse">Memuat katalog...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center text-gray-500 py-20">
                        <p className="text-lg mb-2">😕 Produk tidak ditemukan</p>
                        <p className="text-sm">Coba kata kunci lain atau ubah kategori</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 mb-4">
                            {filteredProducts.length} produk ditemukan
                            {searchQuery && ` untuk "${searchQuery}"`}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
                            {filteredProducts.map((product) => (
                                <Link
                                    to={`/product/${product.id}`}
                                    key={product.id}
                                    className="group cursor-pointer flex flex-col"
                                >
                                    <div className="relative w-full aspect-3/4 overflow-hidden bg-gray-100 rounded-lg mb-3">
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        {product.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                <span className="bg-black text-white text-xs px-3 py-1 rounded-full font-medium">
                                                    SOLD OUT
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="text-sm text-gray-800 font-medium truncate">{product.name}</h3>
                                    {/* Harga */}
                                    <div className="flex items-center gap-2">
                                        {product.discount_percent > 0 ? (
                                            <>
                                                <p className="text-sm text-red-500 font-semibold">
                                                    Rp {product.discounted_price?.toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-xs text-gray-400 line-through">
                                                    Rp {product.price?.toLocaleString('id-ID')}
                                                </p>
                                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">
                                                    -{product.discount_percent}%
                                                </span>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                Rp {product.price?.toLocaleString('id-ID')}
                                            </p>
                                        )}
                                    </div>
                                    {/* Color Dots - hanya tampil kalau ada warna */}
                                    {product.variants?.some(v => v.color_hex && v.color_hex !== '') && (
                                        <div className="flex gap-1 mt-1">
                                            {product.variants
                                                .filter(v => v.color_hex && v.color_hex !== '')
                                                .slice(0, 5)
                                                .map((v, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-3 h-3 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: v.color_hex }}
                                                        title={v.color_name}
                                                    />
                                                ))}
                                            {product.variants.filter(v => v.color_hex && v.color_hex !== '').length > 5 && (
                                                <span className="text-xs text-gray-400">
                                                    +{product.variants.filter(v => v.color_hex && v.color_hex !== '').length - 5}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}