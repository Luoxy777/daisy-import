// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Save, User } from 'lucide-react';

export default function Profile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [customerId, setCustomerId] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }

            const { data: customer } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (customer) {
                setCustomerId(customer.id);
                setFullName(customer.full_name || '');
                setPhone(customer.phone || '');
                setAddress(customer.address || '');
            }
            setLoading(false);
        };
        loadProfile();
    }, [navigate]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        const { error } = await supabase
            .from('customers')
            .update({
                full_name: fullName.trim(),
                phone: phone.trim(),
                address: address.trim()
            })
            .eq('id', customerId);

        if (error) {
            setMessage('Gagal menyimpan: ' + error.message);
        } else {
            setMessage('Profil berhasil disimpan!');
            setTimeout(() => setMessage(''), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-lg mx-auto px-4 py-24">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Profil Saya</h1>
                        <p className="text-sm text-gray-500">Kelola data diri kamu</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
                            placeholder="Nama lengkap"
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">No. HP</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="0812xxxxxxxx"
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Lengkap</label>
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3"
                            placeholder="Alamat untuk pengiriman"
                            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none resize-none" />
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.includes('berhasil') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            {message}
                        </div>
                    )}

                    <button type="submit" disabled={saving}
                        className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50">
                        <Save className="w-4 h-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Profil'}
                    </button>
                </form>
            </div>
        </div>
    );
}