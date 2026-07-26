// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children }) {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                navigate('/login', { replace: true });
                return;
            }

            // 🔥 CEK APAKAH USER ADALAH ADMIN
            const { data: adminData } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (!adminData) {
                // Bukan admin! Redirect ke home
                alert('Akses ditolak! Hanya admin yang bisa mengakses halaman ini.');
                navigate('/', { replace: true });
                return;
            }

            setIsAdmin(true);
            setIsLoading(false);
        };

        checkAdmin();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memeriksa akses...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return children;
}