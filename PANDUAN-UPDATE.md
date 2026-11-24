# Panduan Update dan Pemulihan TokoGT (GitHub + Google Apps Script)

Versi aplikasi saat ini: **2026.11.24.5** (format tanggal.nomor-rilis, dipisah titik) (tampil di Pengaturan > Database & Cadangan > "Versi aplikasi").

## 0. Pahami dulu: ada dua tempat file

| Bagian | Lokasi | File | Fungsi |
|---|---|---|---|
| Aplikasi (tampilan) | GitHub (situs GitHub Pages) | `index.html`, `sw.js` | Yang Anda buka di browser |
| Backend (database) | Google Apps Script | `Code.gs` | Menyimpan data ke Google Sheet |
| Aplikasi versi Apps Script (opsional) | Apps Script, file HTML bernama `index` | `gas/index.html` | Hanya jika Anda membuka aplikasi dari URL `/exec` |

Data toko ada di Google Sheet, bukan di file-file ini. Memperbarui file **tidak menghapus data**.

**Rilis 2026.11.24.5:** `index.html`, `sw.js` dan `Code.gs` berubah. `Code.gs` baru menambah popup tujuan akun Google saat mencadangkan ke Drive (membaca email akun pemilik). Setelah mengganti `Code.gs`, jalankan `setup` dan **beri izin jika Google meminta**, lalu deploy Versi baru. Jika `Code.gs` belum diganti, aplikasi tetap berjalan; hanya tombol Cadangkan ke Google Drive yang menampilkan pesan "Backend belum diperbarui".

## 1. Sebelum memperbarui (3 menit)

1. Buka aplikasi > Pengaturan > Database. Catat **Versi aplikasi** sekarang.
2. Tekan **Export Database** (atau **Salin Data**) dan simpan hasilnya.
3. Tekan **Cadangkan / export ke Google Drive** (jika tersedia), cek akun tujuan di popup, lalu **Ya, cadangkan** agar ada salinan terbaru di folder `TokoGT-Backup`.
4. Siapkan **kunci API** Anda (nilai `KUNCI_API` di `Code.gs`).
5. Ekstrak ZIP `tokogt-github` ke folder di perangkat Anda.

## 2. Update di GitHub

1. Buka https://github.com, login, buka repositori aplikasi Anda.
2. Klik **Add file** > **Upload files**.
3. Seret **`index.html`** dan **`sw.js`** dari folder hasil ekstrak. Nama file harus sama persis dan berada di folder utama repositori. **Jangan** mengunggah `config.js` jika sudah Anda isi.
4. Klik **Commit changes** (pilih *Commit directly to the main branch*).
5. Buka tab **Actions** atau **Settings > Pages**, tunggu *Your site is live* (1 sampai 2 menit).
6. Di perangkat, tutup lalu buka lagi aplikasinya. Jika masih tampilan lama: Ctrl+F5 di komputer, atau hapus data situs di HP.
7. Cek **Versi aplikasi** di Pengaturan > Database: harus berubah ke versi baru.

## 3. Update di Google Apps Script

### 3a. Mengganti Code.gs
1. Buka Google Sheet `TokoGT-Data` > **Ekstensi** > **Apps Script**.
2. Klik **Code.gs**, pilih semua isi (Ctrl+A), hapus.
3. Buka `gas/Code.gs` dari ZIP, salin semuanya, tempel.
4. **Isi baris `const KUNCI_API = ...` dengan kunci Anda yang SAMA seperti sebelumnya.**
5. Klik ikon simpan, pilih fungsi `setup` di dropdown, klik **Jalankan**.
6. (Sekali saja, jika belum pernah) jalankan **`pasangBackupHarian`** dan beri izin Google Drive.

### 3b. Mengganti file index (hanya jika Anda memakai URL /exec)
Klik file **index** (HTML), pilih semua isi, hapus, tempel isi `gas/index.html`, lalu simpan.

### 3c. Deploy ulang (WAJIB setelah 3a atau 3b)
1. **Terapkan** > **Kelola deployment**.
2. Klik ikon **pensil** pada deployment aktif.
3. Pada **Versi** pilih **Versi baru**, isi deskripsi, klik **Terapkan**.
4. **Jangan** memilih *Deployment baru* (URL akan berubah).

## 4. Urutan yang aman
1. Cadangan (bagian 1) > 2. Apps Script (bagian 3) > 3. GitHub (bagian 2) > 4. Verifikasi (bagian 5).

## 5. Verifikasi berhasil
- [ ] Layar login muncul tanpa error.
- [ ] Pengaturan > Database & Cadangan > **Versi aplikasi** = versi baru (format 2026.11.24.5).
- [ ] **Status Google Apps Script** = terhubung, **Status** = Tersinkron.
- [ ] Cadangkan ke Google Drive menampilkan akun tujuan dan nama file; setelah Ya, file muncul di folder TokoGT-Backup.
- [ ] Pratinjau cetak tampil penuh (tidak memendek).
- [ ] Status database: **Tersinkron**.
- [ ] Login berhasil, data lama masih ada.
- [ ] Pengaturan > Log Aktivitas menampilkan aktivitas.
- [ ] Cetak 58mm browser: hasil cetak sama dengan pratinjau.
- [ ] Uji dua perangkat: tambah data di A, tunggu sekitar 6 detik, muncul di B.

## 6. Memulihkan data dari cadangan Google Drive

Cadangan otomatis berupa **salinan Google Sheet** bernama `TokoGT-Backup-tahun-bulan-tanggal_jam` di folder **TokoGT-Backup** pada Google Drive. Ada tiga cara memulihkan.

### Cara A (disarankan): lewat fungsi di Apps Script
Syarat: `Code.gs` versi 2026.11.23-4 sudah terpasang (bagian 3a).
1. Di Apps Script, pilih fungsi **`daftarCadangan`**, klik **Jalankan**, buka **Log eksekusi** (Execution log) di bawah. Catat nama cadangan yang ingin dipulihkan.
2. Di bagian atas `Code.gs`, ubah baris `const PULIHKAN_DARI = '';` menjadi nama itu, misalnya `const PULIHKAN_DARI = 'TokoGT-Backup-2026-11-24_0200';`. Biarkan kosong untuk memakai cadangan paling baru. Klik simpan.
3. Pilih fungsi **`pulihkanDariCadangan`**, klik **Jalankan**. Fungsi ini lebih dulu membuat cadangan pengaman dari kondisi sekarang, lalu menimpa data dengan isi cadangan.
4. Log menampilkan "Dipulihkan dari ...". Semua perangkat memuat data baru dalam sekitar 6 detik. Tidak perlu deploy ulang.
5. Kembalikan baris `PULIHKAN_DARI` menjadi `''` agar tidak lupa.

### Cara B: salin manual dari cadangan
1. Di Google Drive buka folder **TokoGT-Backup**, buka file cadangan yang diinginkan.
2. Buka tab **docs**, pilih semua isi (klik kotak pojok kiri atas), salin (Ctrl+C).
3. Buka Sheet utama `TokoGT-Data` > tab **docs**, pilih semua, hapus, klik sel A1, tempel (Ctrl+V).
4. Di Apps Script jalankan fungsi **`bumpVersi`** agar semua perangkat memuat ulang.

### Cara C: dari file Export Database (JSON)
Jika Anda punya file hasil **Export Database** atau teks hasil **Salin Data**: buka aplikasi (login admin) > Pengaturan > Database > **Import Database**, pilih file atau tempel teksnya, lalu konfirmasi.

Catatan: pemulihan menimpa **seluruh** data sekarang. Cadangan pengaman otomatis dibuat sebelum menimpa (Cara A).

## 7. Kesalahan yang sering terjadi

| Gejala | Penyebab | Solusi |
|---|---|---|
| Tampilan lama masih muncul | Cache browser | Ctrl+F5 atau hapus data situs |
| Versi aplikasi tidak berubah | Commit belum selesai / file salah tempat | Tunggu *Your site is live*, pastikan `index.html` di root repositori |
| "Kunci API tidak cocok" | `KUNCI_API` berbeda | Isi kunci benar, jalankan `setup`, lalu Ubah Koneksi di aplikasi |
| "Backend belum diperbarui" | Lupa deploy versi baru | Bagian 3c |
| Pemulihan: "File cadangan tidak ditemukan" | Nama di `PULIHKAN_DARI` salah | Jalankan `daftarCadangan`, salin nama persis |
| Setelah pulih data belum berubah di perangkat | Perangkat belum memuat ulang | Tunggu 6 detik atau buka ulang aplikasi; jalankan `bumpVersi` |
| Pengaturan koneksi hilang | `config.js` tertimpa | Isi ulang (Pengaturan > Database > Salin isi config.js) |
| URL `/exec` berubah | Memilih *Deployment baru* | Pakai URL baru di layar Koneksi |

## 8. Membatalkan update (rollback)
- **GitHub:** repositori > `index.html` > **History** > commit lama > **Revert**, atau unggah lagi `index.html` lama.
- **Apps Script:** **Terapkan** > **Kelola deployment** > pensil > pilih versi sebelumnya > **Terapkan**.
- **Data:** pulihkan dari cadangan (bagian 6).

## Riwayat versi
- **2026.11.24.5:** menu Database & Cadangan digabung dalam satu kartu (status koneksi realtime, status sinkron, versi, cadangkan ke penyimpanan, cadangkan ke Google Drive dengan popup akun tujuan, pulihkan, salin data); pratinjau cetak tampil penuh sesuai isi; isi slip lengkap (periode, nama, jabatan, status, keterangan). `Code.gs` berubah.
- **2026.11.23-4:** hasil cetak 58mm browser berupa gambar yang sama dengan pratinjau (rata kiri kanan, teks panjang turun otomatis); tombol Ya/Tidak lebih kecil dan teksnya di tengah; pengaturan lebar cetak 58mm; fungsi pemulihan cadangan di `Code.gs`.
- **2026.11.23-3:** cadangan harian ke Google Drive, kunci bulan, log aktivitas, slip massal, transaksi berulang, filter, export. `Code.gs` berubah.
- **2026.11.23-2:** pengaturan tampilan tersinkron; popup Ya/Tidak; tanggal otomatis; payout tanpa tanggal.
- **2026.11.23-1:** penyimpanan per catatan, diagnosa koneksi. `Code.gs` baru.
