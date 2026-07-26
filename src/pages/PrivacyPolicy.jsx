// src/pages/PrivacyPolicy.jsx
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-24">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-8 h-8 text-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 text-sm text-gray-600 leading-relaxed">
                    <p>Kami menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi data pribadi Anda.</p>

                    <h3 className="font-semibold text-gray-900">1. Data yang Kami Kumpulkan</h3>
                    <p>- Nama, email, nomor telepon, dan alamat (hanya saat Anda mendaftar atau checkout)<br />- Data pesanan: produk yang dibeli, jumlah, dan total harga<br />- Data sesi: ID unik untuk keranjang belanja</p>

                    <h3 className="font-semibold text-gray-900">2. Penggunaan Data</h3>
                    <p>- Memproses pesanan dan pengiriman<br />- Komunikasi terkait pesanan melalui WhatsApp<br />- Menyimpan riwayat pesanan untuk referensi Anda</p>

                    <h3 className="font-semibold text-gray-900">3. Keamanan Data</h3>
                    <p>- Data disimpan di database terenkripsi (Supabase)<br />- Koneksi menggunakan HTTPS/SSL<br />- Password di-hash dan tidak dapat dibaca oleh siapapun</p>

                    <h3 className="font-semibold text-gray-900">4. Cookie & Local Storage</h3>
                    <p>- Kami menggunakan localStorage browser untuk menyimpan keranjang belanja<br />- Data keranjang hanya ada di perangkat Anda</p>

                    <h3 className="font-semibold text-gray-900">5. Pihak Ketiga</h3>
                    <p>- Kami tidak menjual atau membagikan data Anda ke pihak ketiga<br />- Pembayaran diproses manual melalui WhatsApp/transfer</p>

                    <h3 className="font-semibold text-gray-900">6. Hak Anda</h3>
                    <p>- Anda dapat meminta penghapusan data kapan saja melalui WhatsApp<br />- Anda dapat melihat dan mengedit profil Anda</p>

                    <p className="pt-4 border-t text-xs text-gray-400">Terakhir diperbarui: 2026</p>
                </div>
            </div>
        </div>
    );
}