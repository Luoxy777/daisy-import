// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [agreePrivacy, setAgreePrivacy] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('login');

    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (mode === 'register') {
                // Validasi
                if (!fullName.trim()) {
                    setError('Nama lengkap harus diisi!');
                    setIsLoading(false);
                    return;
                }
                if (!agreePrivacy) {
                    setError('Anda harus menyetujui Privacy Policy!');
                    setIsLoading(false);
                    return;
                }

                // Register
                const { data, error } = await supabase.auth.signUp({ email, password });

                if (error) throw error;

                if (data.user) {
                    // Buat customer profile
                    const { error: customerError } = await supabase
                        .from('customers')
                        .insert({
                            user_id: data.user.id,
                            full_name: fullName.trim(),
                            phone: phone.trim()
                        });

                    if (customerError) console.error('Customer insert error:', customerError);

                    alert('Registrasi berhasil! Silakan login.');
                    setMode('login');
                }
            } else {
                // Login
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) throw error;

                if (data.session) {
                    // Cek customer profile
                    const { data: customer } = await supabase
                        .from('customers')
                        .select('*')
                        .eq('user_id', data.user.id)
                        .single();

                    if (!customer) {
                        await supabase.from('customers').insert({
                            user_id: data.user.id,
                            full_name: email.split('@')[0]
                        });
                    }

                    navigate(from, { replace: true });
                }
            }
        } catch (error) {
            console.error('Auth error:', error);
            if (error.message.includes('Invalid login credentials')) {
                setError('Email atau password salah!');
            } else {
                setError(error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-20">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="text-2xl font-bold tracking-widest text-gray-900">
                        DAISY IMPORT
                    </Link>
                    <p className="text-gray-500 mt-2">
                        {mode === 'login' ? 'Login ke akun kamu' : 'Daftar akun baru'}
                    </p>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                    {/* Toggle */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mb-6">
                        <button type="button" onClick={() => { setMode('login'); setError(''); }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>
                            Login
                        </button>
                        <button type="button" onClick={() => { setMode('register'); setError(''); }}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${mode === 'register' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}>
                            Register
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Nama (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap *</label>
                                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                    required={mode === 'register'} placeholder="Nama kamu"
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                placeholder="email@example.com"
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" autoComplete="email" />
                        </div>

                        {/* Phone (register only) */}
                        {mode === 'register' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">No. HP (opsional)</label>
                                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                    placeholder="0812xxxxxxxx"
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" />
                            </div>
                        )}

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                                placeholder="Minimal 6 karakter"
                                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-black outline-none" autoComplete="current-password" />
                        </div>

                        {/* Privacy Policy Checkbox */}
                        {mode === 'register' && (
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    id="privacy"
                                    checked={agreePrivacy}
                                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                                    className="mt-1 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                                />
                                <label htmlFor="privacy" className="text-sm text-gray-600">
                                    Saya menyetujui{' '}
                                    <Link to="/terms" className="text-black underline font-medium" target="_blank">
                                        Syarat & Ketentuan
                                    </Link>{' '}
                                    dan{' '}
                                    <Link to="/privacy" className="text-black underline font-medium" target="_blank">
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={isLoading}
                            className="w-full bg-black text-white font-medium py-3 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                            {isLoading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
                        </button>
                    </form>

                    {/* Toggle */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center">
                            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
                                className="text-black font-medium underline">
                                {mode === 'login' ? 'Register di sini' : 'Login di sini'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}