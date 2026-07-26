// src/components/ProtectedRoute.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ProtectedRoute({ children }) {
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Cek session saat ini
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setIsLoading(false);

            if (!session) {
                // Redirect ke login dengan return URL
                navigate('/login', {
                    state: { from: window.location.pathname },
                    replace: true
                });
            }
        });

        // Listen perubahan auth state
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session) {
                navigate('/login', { replace: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memeriksa sesi...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null; // Akan redirect di useEffect
    }

    return children;
}   