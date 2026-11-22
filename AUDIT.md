# Audit Awal DAGBOEK / KDMP ERP
Tanggal: 21 November 2026
Cabang kerja: `work/dagboek-stabilization-2026-11-21`

## Ringkasan
Repository dan project Supabase aktif dan terhubung. Audit dilakukan secara baca-saja pada database produksi. Perubahan kode awal disimpan di cabang kerja terpisah dan belum dipublikasikan ke `main`.

## Perubahan kode pada cabang ini
- Penjualan toko dialihkan ke RPC `proses_penjualan_toko_atomik`.
- Jalur rollback JavaScript yang menimpa `current_stock` dan mencoba menghapus baris mutasi dihapus dari alur penjualan.
- Identitas UI awal diselaraskan menjadi DAGBOEK by Nusa Pixel.
- Tipografi Inter/Playfair Display, sidebar charcoal, aksen heritage gold, dan fondasi dark mode yang lebih terbaca ditambahkan.
- Navigasi dan form utama diberi role guard untuk manajer, admin keuangan, kasir, admin gudang, dan pengurus.
- Dua migration disiapkan: integritas/RPC dan RLS berbasis role. Keduanya lolos uji eksekusi dalam transaksi rollback.
- Pilihan role undangan diselaraskan dengan role database: `admin_keuangan`, `kasir`, `admin_gudang`, `pengurus`.
- Tema dasar charcoal/heritage gold dan peningkatan keterbacaan dark mode ditambahkan.

## Hasil pengujian
- `app.js`: pemeriksaan sintaks JavaScript lulus.
- `utang-piutang.js`: pemeriksaan sintaks JavaScript lulus.
- RPC penjualan atomik diuji dalam transaksi database sementara yang diakhiri dengan `ROLLBACK`.
- RPC pembatalan transaksi diuji setelah membuat penjualan uji: dua mutasi (keluar dan pengembalian), satu jurnal pembalik, status dibatalkan, dan stok kembali ke nilai awal. Seluruh data uji di-`ROLLBACK`.
- Pengujian membuktikan header, detail, mutasi, dan jurnal terbentuk dalam transaksi yang sama; setelah rollback stok kembali ke nilai awal dan tidak ada data uji tertinggal.
- Simulasi role Kasir dengan kedua migration aktif sementara membuktikan kasir dapat membuat penjualan atomik dan membaca header/detail/mutasi yang terkait. Setelah `ROLLBACK`, role manajer, stok, dan tabel produksi kembali seperti semula.
- Simulasi role Admin Gudang membuktikan trigger mutasi mengabaikan nilai `stock_before`/`stock_after` dari klien dan menyimpan snapshot terkunci yang benar. Percobaan update langsung ke `current_stock` ditolak selama migration aktif. Setelah `ROLLBACK`, stok dan data uji kembali seperti semula.
- Migration integritas/RPC berhasil diuji sintaks dan eksekusinya dalam transaksi yang diakhiri `ROLLBACK`; migration belum diterapkan ke database produksi.
- Seluruh 19 jurnal posted yang ada saat audit seimbang.

## Temuan kritis
1. **Keamanan RLS belum konsisten dengan role aplikasi.** Sejumlah tabel operasional memakai kebijakan `true` untuk seluruh pengguna authenticated. Contoh mencakup invoice, anggota, simpanan/pinjaman, persediaan, penjualan, mitra, dan log operasional. Pembatasan tombol di frontend bukan pengganti RLS.
2. **Fungsi SECURITY DEFINER terlalu terbuka.** Advisor Supabase menemukan beberapa RPC dapat dieksekusi role anon dan/atau authenticated. Perlu audit hak eksekusi dan pemeriksaan role di dalam fungsi.
3. **Mutasi persediaan memiliki celah audit.** Trigger `process_inventory_movement` menghitung stok dari `current_stock`, tetapi belum menimpa `NEW.stock_before` dan `NEW.stock_after` dengan nilai yang benar-benar dikunci di database.
4. **Ada celah urutan mutasi historis.** Aqua botol memiliki satu transisi stok yang tidak tercatat; Beras 10 KG memiliki dua transisi yang tidak tercatat. Nilai `current_stock` saat ini sama dengan `stock_after` mutasi terakhir. Data historis tidak boleh diubah untuk menutup celah ini.
5. **Beberapa penjualan selesai tidak memiliki jurnal penjualan.** Empat transaksi historis perlu ditelusuri. Dua invoice historis juga tidak memiliki jurnal invoice yang terdeteksi.
6. **Simpanan dan angsuran belum terhubung ke jurnal.** Fungsi pembayaran angsuran memperbarui pembayaran dan status jadwal, tetapi tidak membuat jurnal. Transaksi simpanan yang ada juga belum memiliki jurnal terkait.
7. **Undang pengguna belum siap.** Edge Function `invite-user` belum ada; tabel membership/invitation belum memiliki policy RLS; form role sebelumnya tidak sesuai constraint database. Pilihan role pada cabang ini sudah diperbaiki, tetapi alur undangan belum diaktifkan.
8. **Multi-koperasi belum diterapkan pada data operasional.** Tabel `cooperatives` dan `cooperative_memberships` sudah ada, tetapi tabel inti transaksi belum memiliki `cooperative_id`. Saat ini instalasi berisi satu koperasi.
9. **Pengaturan profil koperasi masih lokal.** Nama, email, alamat, telepon, dan logo disimpan di localStorage, bukan disinkronkan ke Supabase.
10. **Dashboard belum mencakup seluruh sumber transaksi.** KPI pemasukan/pengeluaran dan grafik utama saat ini dihitung dari `financial_transactions`; penjualan toko dan modul simpanan/pinjaman tidak tercakup sebagai satu ringkasan operasional.
11. **DABU belum diimplementasikan.** Belum ada Edge Function AI, tabel memori, UI assistant, atau konfigurasi provider AI.
12. **Tutup buku dan pengujian otomatis belum tersedia.** Belum ditemukan rangkaian test otomatis untuk alur lintas modul.

## Aturan keselamatan data
- `current_stock` tetap menjadi satu-satunya sumber stok operasional.
- Kolom legacy `stock` tidak digunakan oleh kode aktif; jangan jadikan sumber hitung.
- Jangan menghapus atau mengedit riwayat mutasi yang sudah ada.
- Jangan mengoreksi saldo historis otomatis. Setiap koreksi harus berupa transaksi penyesuaian baru yang disetujui dan dapat diaudit.
- Perubahan database produksi dilakukan setelah migration diuji dan dampaknya diverifikasi.

## Urutan pengerjaan berikutnya
1. Selesaikan perbaikan trigger mutasi dan hardening RPC/RLS.
2. Buat role matrix yang konsisten antara menu, RPC, dan RLS.
3. Audit dan rapikan jurnal invoice, penjualan, simpanan, dan pinjaman tanpa mengubah transaksi lama.
4. Benahi dashboard dan sinkronisasi pengaturan.
5. Implementasikan undangan pengguna dan fondasi multi-koperasi.
6. Implementasikan DABU melalui server-side Edge Function; API key AI harus disimpan sebagai secret server, bukan di frontend.
7. Tambahkan tutup buku, audit trail, dan regression tests lintas modul.
