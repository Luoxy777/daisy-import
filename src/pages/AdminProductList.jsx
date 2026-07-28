// src/pages/AdminProductList.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

export default function AdminProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState([]); // Multi-select
    const [categories, setCategories] = useState([]);

    const fetchProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('*, category:category_id(name)')
            .order('created_at', { ascending: false });
        if (data) setProducts(data);

        const { data: catData } = await supabase.from('categories').select('*');
        if (catData) setCategories(catData);

        setLoading(false);
    };

    useEffect(() => { fetchProducts(); }, []);

    const toggleActive = async (product) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !product.is_active })
            .eq('id', product.id);

        if (!error) {
            setProducts(prev => prev.map(p =>
                p.id === product.id ? { ...p, is_active: !p.is_active } : p
            ));
        }
    };

    const deleteProduct = async (product) => {
        if (!confirm(`Yakin hapus "${product.name}"?`)) return;
        await supabase.from('product_variants').delete().eq('product_id', product.id);
        const { error } = await supabase.from('products').delete().eq('id', product.id);
        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            alert('Gagal menghapus: ' + error.message);
        }
    };

    const toggleCategory = (catId) => {
        setCategoryFilter(prev =>
            prev.includes(catId)
                ? prev.filter(id => id !== catId)
                : [...prev, catId]
        );
    };

    const clearCategoryFilter = () => setCategoryFilter([]);

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter.length === 0 || categoryFilter.includes(p.category_id);
        return matchSearch && matchCategory;
    });

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Daftar Produk</h1>
                    <p className="text-sm text-gray-500">
                        {filtered.length === products.length
                            ? `${products.length} produk`
                            : `${filtered.length} dari ${products.length} produk`}
                    </p>
                </div>
                <Link to="/admin/add" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                    + Tambah Produk
                </Link>
            </div>

            {/* Search + Category Multi-Select */}
            <div className="space-y-3 mb-6">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari produk..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none"
                    />
                </div>

                {/* Multi-Select Kategori */}
                <div className="bg-white border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori</span>
                        {categoryFilter.length > 0 && (
                            <button
                                onClick={clearCategoryFilter}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                            >
                                Hapus semua filter
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                            const isActive = categoryFilter.includes(cat.id);
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${isActive
                                            ? 'bg-black text-white border-black'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    {cat.name}
                                    {isActive && <span className="ml-1 text-[10px]">✕</span>}
                                </button>
                            );
                        })}
                    </div>
                    {categoryFilter.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                            {categoryFilter.length} kategori dipilih
                        </p>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Kategori</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stok</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Status</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-14 md:w-12 md:h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate max-w-37.5 md:max-w-50">{product.name}</p>
                                                <p className="text-xs text-gray-400 md:hidden">{product.category?.name}</p>
                                                <p className="text-xs text-gray-400 hidden md:block">{product.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{product.category?.name}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium whitespace-nowrap">
                                        Rp {product.price?.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-sm font-medium ${product.stock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                                        <button
                                            onClick={() => toggleActive(product)}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${product.is_active
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            <span className="hidden lg:inline">{product.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                to={`/admin/edit/${product.id}`}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => deleteProduct(product)}
                                                className="p-1.5 hover:bg-red-50 rounded text-red-500"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                        {search || categoryFilter.length > 0
                            ? 'Tidak ada produk ditemukan. Coba ubah filter.'
                            : 'Belum ada produk. Klik "Tambah Produk" untuk mulai.'}
                    </div>
                )}
            </div>
        </div>
    );
}