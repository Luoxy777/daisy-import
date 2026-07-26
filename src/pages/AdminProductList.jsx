// src/pages/AdminProductList.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Edit2, Trash2, Eye, EyeOff, Filter } from 'lucide-react';

export default function AdminProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
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

        // Hapus variants dulu
        await supabase.from('product_variants').delete().eq('product_id', product.id);

        // Hapus product
        const { error } = await supabase.from('products').delete().eq('id', product.id);

        if (!error) {
            setProducts(prev => prev.filter(p => p.id !== product.id));
        } else {
            alert('Gagal menghapus: ' + error.message);
        }
    };

    const filtered = products.filter(p => {
        const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
        return matchSearch && matchCategory;
    });

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Daftar Produk</h1>
                    <p className="text-sm text-gray-500">{products.length} produk</p>
                </div>
                <Link to="/admin/add" className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                    + Tambah Produk
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-6 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari produk..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-black outline-none"
                >
                    <option value="all">Semua Kategori</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Produk</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Harga</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stok</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                                <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-400">{product.id.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{product.category?.name}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        Rp {product.price?.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-sm font-medium ${product.stock <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                            {product.stock || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => toggleActive(product)}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${product.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {product.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link
                                                to={`/admin/edit/${product.id}`}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Link>
                                            <button
                                                onClick={() => deleteProduct(product)}
                                                className="p-1.5 hover:bg-red-50 rounded text-red-500"
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
                        Tidak ada produk ditemukan
                    </div>
                )}
            </div>
        </div>
    );
}