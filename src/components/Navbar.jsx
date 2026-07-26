// src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { Menu, ShoppingBag, User, LogOut, X, HelpCircle, Shield, ChevronRight, Settings, Plus, FileText } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useCart } from '../context/CartContext';

export default function Navbar() {
    const [session, setSession] = useState(null);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { totalItems, customer } = useCart();

    const isAdminPage = location.pathname.startsWith('/admin');
    const isLoginPage = location.pathname === '/login';

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) checkAdmin(session.user.id);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) checkAdmin(session.user.id);
            else setIsAdminUser(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = async (userId) => {
        const { data } = await supabase.from('admins').select('*').eq('user_id', userId).single();
        setIsAdminUser(!!data);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setShowUserMenu(false);
        setIsAdminUser(false);
        navigate('/');
    };

    return (
        <>
            <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
                <div className="flex justify-between items-center px-4 md:px-8 h-16">
                    {/* KIRI */}
                    <div className="flex items-center gap-2 w-25">
                        {!isAdminPage && !isLoginPage && (
                            <button onClick={() => setShowMobileMenu(true)} className="p-2 hover:bg-gray-100 rounded-md">
                                <Menu className="w-6 h-6 text-gray-800" />
                            </button>
                        )}
                        {isAdminPage && (
                            <Link to="/" className="text-xs text-gray-500 hover:text-black font-medium flex items-center gap-1">← Toko</Link>
                        )}
                    </div>

                    {/* TENGAH */}
                    <Link to={isAdminPage ? "/admin/products" : "/"} className="text-xl font-bold tracking-widest text-gray-900">
                        {isAdminPage ? 'ADMIN' : 'DAISY IMPORT'}
                    </Link>

                    {/* KANAN */}
                    <div className="flex items-center gap-2 justify-end w-25">
                        {/* Admin menu */}
                        {isAdminPage && session && (
                            <div className="relative">
                                <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 hover:bg-gray-100 rounded-md">
                                    <User className="w-5 h-5 text-gray-800" />
                                </button>
                                {showUserMenu && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-xl z-20 py-2">
                                            <Link to="/admin/products" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings className="w-4 h-4" /> Semua Produk</Link>
                                            <Link to="/admin/add" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Plus className="w-4 h-4" /> Tambah Produk</Link>
                                            <div className="border-t my-1" />
                                            <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Logout</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* User menu + Cart */}
                        {!isAdminPage && !isLoginPage && (
                            <>
                                {session ? (
                                    <div className="relative">
                                        <button onClick={() => setShowUserMenu(!showUserMenu)} className="p-2 hover:bg-gray-100 rounded-md">
                                            <User className="w-5 h-5 text-gray-800" />
                                        </button>
                                        {showUserMenu && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-xl z-20 py-2">
                                                    <div className="px-4 py-2 text-xs text-gray-400 border-b truncate">
                                                        {customer?.full_name || session.user.email}
                                                    </div>
                                                    <Link to="/profile" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><User className="w-4 h-4" /> Profil Saya</Link>
                                                    {isAdminUser && (
                                                        <Link to="/admin/products" onClick={() => setShowUserMenu(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"><Settings className="w-4 h-4" /> Admin Panel</Link>
                                                    )}
                                                    <div className="border-t my-1" />
                                                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="w-4 h-4" /> Logout</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link to="/login" className="p-2 hover:bg-gray-100 rounded-md">
                                        <User className="w-5 h-5 text-gray-400" />
                                    </Link>
                                )}
                                <Link to="/cart" className="p-2 relative hover:bg-gray-100 rounded-md">
                                    <ShoppingBag className="w-5 h-5 text-gray-800" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] min-w-4.5 h-4.5 flex items-center justify-center rounded-full px-1 font-bold">
                                            {totalItems}
                                        </span>
                                    )}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {showMobileMenu && !isAdminPage && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileMenu(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-in">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-lg font-bold">Menu</h2>
                                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-gray-100 rounded-md"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="space-y-1">
                                <Link to="/" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                    <span className="text-sm font-medium">Home</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                </Link>
                                <Link to="/cart" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                    <span className="text-sm font-medium">Keranjang ({totalItems})</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                </Link>

                                {session ? (
                                    <>
                                        <Link to="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                            <span className="text-sm font-medium">Profil Saya</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                        </Link>
                                        {isAdminUser && (
                                            <Link to="/admin/products" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                                <span className="text-sm font-medium">Admin Panel</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                            </Link>
                                        )}
                                        <button onClick={handleLogout} className="flex items-center gap-2 w-full p-3 rounded-lg hover:bg-red-50 text-red-600">
                                            <LogOut className="w-4 h-4" /><span className="text-sm font-medium">Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <Link to="/login" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                        <span className="text-sm font-medium">Login / Register</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                    </Link>
                                )}

                                <div className="border-t my-4" />
                                <button onClick={() => { setShowMobileMenu(false); alert('FAQ:\n\n- Cara order: Pilih produk > Cart > WhatsApp\n- Pembayaran: Transfer/COD\n- Pengiriman: 2-5 hari kerja\n- Size guide: Cek deskripsi produk'); }}
                                    className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-gray-50">
                                    <span className="text-sm font-medium flex items-center gap-2"><HelpCircle className="w-4 h-4" /> FAQ</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                                <Link to="/terms" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                    <span className="text-sm font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Syarat & Ketentuan</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                </Link>
                                <Link to="/privacy" onClick={() => setShowMobileMenu(false)} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                                    <span className="text-sm font-medium flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy Policy</span><ChevronRight className="w-4 h-4 text-gray-400" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}