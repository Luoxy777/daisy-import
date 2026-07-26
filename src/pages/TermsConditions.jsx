// src/pages/TermsConditions.jsx
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsConditions() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-24">
                <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-6">
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </Link>
                <div className="flex items-center gap-3 mb-6">
                    <FileText className="w-8 h-8 text-gray-700" />
                    <h1 className="text-2xl font-bold text-gray-900">Syarat & Ketentuan</h1>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4 text-sm text-gray-600 leading-relaxed">

                    <h3 className="font-semibold text-gray-900">1. Umum</h3>
                    <p>Dengan mengakses dan menggunakan layanan DAISY IMPORT, Anda dianggap telah membaca, memahami, dan menyetujui seluruh syarat dan ketentuan yang berlaku. Jika Anda tidak menyetujui, mohon untuk tidak menggunakan layanan kami.</p>

                    <h3 className="font-semibold text-gray-900">2. Akun Pengguna</h3>
                    <p>- Anda bertanggung jawab menjaga kerahasiaan akun dan password Anda<br />
                        - Anda bertanggung jawab atas semua aktivitas yang terjadi di akun Anda<br />
                        - Kami berhak menonaktifkan akun yang melanggar ketentuan</p>

                    <h3 className="font-semibold text-gray-900">3. Produk & Harga</h3>
                    <p>- Semua harga tercantum dalam Rupiah (Rp)<br />
                        - Harga dapat berubah sewaktu-waktu tanpa pemberitahuan<br />
                        - Gambar produk hanya ilustrasi, warna asli mungkin sedikit berbeda<br />
                        - Kami berhak membatalkan pesanan jika stok tidak tersedia</p>

                    <h3 className="font-semibold text-gray-900">4. Pemesanan</h3>
                    <p>- Pemesanan dilakukan melalui WhatsApp setelah checkout<br />
                        - Pesanan dianggap sah setelah konfirmasi dari admin<br />
                        - Stok produk bersifat real-time dan dapat berubah</p>

                    <h3 className="font-semibold text-gray-900">5. Pembayaran</h3>
                    <p>- Pembayaran dilakukan via transfer bank atau COD (sesuai kesepakatan)<br />
                        - Pembayaran harus dilakukan dalam waktu 1x24 jam setelah konfirmasi<br />
                        - Pesanan dapat dibatalkan jika pembayaran tidak diterima</p>

                    <h3 className="font-semibold text-gray-900">6. Pengiriman</h3>
                    <p>- Pengiriman dilakukan dalam 2-5 hari kerja setelah pembayaran dikonfirmasi<br />
                        - Ongkos kirim ditanggung pembeli (kecuali promo gratis ongkir)<br />
                        - Risiko kerusakan selama pengiriman menjadi tanggung jawab jasa ekspedisi</p>

                    <h3 className="font-semibold text-gray-900">7. Retur & Pengembalian</h3>
                    <p>- Barang dapat diretur dalam 3 hari setelah diterima jika terdapat cacat/cacat produksi<br />
                        - Barang harus dalam kondisi original (belum dipakai, dicuci, label masih ada)<br />
                        - Ongkos retur ditanggung penjual untuk barang cacat, ditanggung pembeli untuk alasan lain<br />
                        - Refund diproses dalam 3-7 hari kerja setelah barang diterima kembali</p>

                    <h3 className="font-semibold text-gray-900">8. Privasi</h3>
                    <p>Data pribadi Anda dilindungi sesuai dengan <Link to="/privacy" className="text-black underline">Privacy Policy</Link> kami.</p>

                    <h3 className="font-semibold text-gray-900">9. Perubahan</h3>
                    <p>Kami berhak mengubah Syarat & Ketentuan ini sewaktu-waktu. Perubahan akan diinformasikan melalui website.</p>

                    <h3 className="font-semibold text-gray-900">10. Kontak</h3>
                    <p>Untuk pertanyaan, silakan hubungi kami melalui WhatsApp di nomor yang tertera di halaman checkout.</p>

                    <p className="pt-4 border-t text-xs text-gray-400">Terakhir diperbarui: 2026</p>
                </div>
            </div>
        </div>
    );
}