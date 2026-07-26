// src/components/AdminRoute.jsx
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function AdminRoute({ children }) {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            setIsAdmin(!!data);
            setLoading(false);
        };
        check();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}