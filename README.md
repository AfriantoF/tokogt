# TokoGT - Aplikasi Pencatatan Keuntungan Toko

Aplikasi web satu halaman (tanpa build, tanpa server) untuk mencatat pendapatan, pengeluaran, gaji karyawan, modal dan kas pemodal, lengkap dengan cetak dan bagikan slip gaji atau laporan sebagai PDF atau gambar.

## Isi repositori

| File / folder | Fungsi |
|---|---|
| `index.html` | Seluruh aplikasi (HTML, CSS, JavaScript dalam satu file) |
| `config.js` | Koneksi otomatis (opsional), isi URL dan kunci Apps Script |
| `manifest.webmanifest`, `sw.js`, `icons/` | Agar bisa dipasang di layar utama HP (PWA) dan dibuka offline |
| `gas/Code.gs` | Backend Google Apps Script (opsional, untuk database bersama) |
| `.nojekyll` | Memberi tahu GitHub Pages agar tidak memproses file |

## Cara deploy ke GitHub Pages

1. Buat akun di https://github.com lalu klik **New repository**. Beri nama misalnya `tokogt`, pilih **Public**, klik **Create repository**.
2. Klik **uploading an existing file**, lalu unggah **semua isi folder ini** (`index.html`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, folder `icons` dan `gas`). Klik **Commit changes**.
3. Buka **Settings > Pages**. Pada *Build and deployment* pilih **Source: Deploy from a branch**, **Branch: main**, folder **/ (root)**, lalu **Save**.
4. Tunggu 1 sampai 2 menit. Alamat aplikasi: `https://NAMA-GITHUB-ANDA.github.io/tokogt/`
5. Buka alamat itu di HP, lalu pilih **Tambahkan ke Layar Utama** agar tampil seperti aplikasi.

Catatan: repositori Public berarti kode aplikasi bisa dilihat orang lain. Data toko tidak ada di repositori, jadi aman.

## Memilih tempat penyimpanan data

Aplikasi tidak menyimpan data di browser. Semua data tersimpan di Google Sheet lewat Apps Script, sehingga semua browser dan perangkat melihat data yang sama. Saat pertama dibuka, aplikasi menampilkan layar **Koneksi**:

- **Google Apps Script:** data bersama di Google Sheet, bisa dipakai banyak perangkat.
  1. Buat Google Sheet baru, buka **Extensions > Apps Script**, tempel isi `gas/Code.gs`.
  2. Ganti `KUNCI_API` dengan kunci rahasia Anda, jalankan fungsi `setup()` sekali dan beri izin.
  3. **Deploy > New deployment > Web app**: *Execute as: Me*, *Who has access: Anyone*. Salin URL berakhiran `/exec`.
  4. Di aplikasi, tempel URL dan kunci pada layar Koneksi, lalu **Uji & Simpan**.
  Perubahan dari perangkat lain muncul dalam sekitar 30 detik (batas kuota Apps Script).

Koneksi bisa diubah kapan saja di **Pengaturan > Database**.

## Agar tidak meminta URL dan kunci di browser atau perangkat lain

Layar Koneksi muncul lagi di browser lain karena pengaturan tersimpan per browser. Agar semua browser langsung terhubung, pilih salah satu:

**Cara 1 - Isi `config.js` (untuk situs di GitHub Pages).**
1. Di aplikasi yang sudah terhubung, buka **Pengaturan > Database** lalu tekan **Salin isi config.js**.
2. Di repositori GitHub, buka `config.js`, klik ikon pensil, hapus isinya, tempel hasil salinan, lalu **Commit changes**.
3. Tunggu 1 sampai 2 menit. Di browser lain, muat ulang dengan Ctrl+F5 (atau hapus data situs) agar versi baru terbaca.

**Cara 2 - Buka langsung dari Apps Script (tanpa GitHub, tanpa isi apa pun).**
Tambahkan file HTML bernama `index` di proyek Apps Script, isi dengan `gas/index.html`, lalu **Deploy ulang** (Kelola deployment > Versi baru). Buka URL `/exec`: URL dan kunci disisipkan otomatis oleh server di semua perangkat.

**Cara 3 - Link setup.** Di aplikasi yang sudah terhubung, tekan **Salin Link Setup Perangkat Baru**, lalu buka link itu sekali di perangkat baru.

Catatan: pada Cara 1 dan 2, kunci API bisa terbaca oleh siapa saja yang bisa membuka situs. Login aplikasi tetap melindungi tampilan, tapi jangan sebarkan alamat situs ke orang yang tidak dipercaya. Pada Cara 3 kunci tidak ada di situs.

## Cara memperbarui aplikasi jika ada versi baru

Panduan lengkap dan rinci ada di file **PANDUAN-UPDATE.md**. Ringkasan:

Setiap pembaruan terdiri dari file `index.html` (aplikasi) dan kadang `Code.gs` (backend). Data toko tidak ikut berubah karena tersimpan di Google Sheet.

**A. Memperbarui di GitHub (situs GitHub Pages)**
1. Ekstrak ZIP versi baru di perangkat Anda.
2. Buka repositori Anda di github.com, klik **Add file > Upload files**.
3. Seret file dari ZIP yang berubah (biasanya `index.html`, `sw.js`). Nama file harus sama persis agar menimpa yang lama.
4. Jangan unggah `config.js` jika Anda sudah mengisinya, supaya isinya tidak terhapus.
5. Klik **Commit changes**. Tunggu 1 sampai 2 menit sampai Settings > Pages menunjukkan *Your site is live*.
6. Di perangkat, tutup lalu buka lagi aplikasinya. Jika masih tampilan lama, muat ulang paksa (Ctrl+F5 di komputer, atau hapus data situs di HP).

**B. Memperbarui di Google Apps Script**
1. Buka Google Sheet `TokoGT-Data` > **Ekstensi > Apps Script**.
2. Jika ZIP menyertakan `Code.gs` baru: buka `Code.gs`, hapus isinya, tempel isi `gas/Code.gs` baru. **Ingat mengganti lagi `KUNCI_API` dengan kunci Anda yang lama**, lalu jalankan fungsi `setup` sekali.
3. Jika Anda membuka aplikasi dari URL `/exec`: buka file `index` (HTML), hapus isinya, tempel isi `gas/index.html` baru.
4. Klik **Simpan** (ikon disket).
5. **Wajib deploy ulang:** klik **Terapkan > Kelola deployment**, klik ikon pensil, pada *Versi* pilih **Versi baru**, lalu **Terapkan**. URL `/exec` tidak berubah. Jangan memilih *Deployment baru*, karena URL-nya akan berganti.
6. Muat ulang aplikasi di browser.

Urutan aman: perbarui Apps Script (B) dulu, baru GitHub (A). Lakukan **Export Database** sebelum memperbarui sebagai cadangan.

## Jika muncul "Tidak terhubung ke database"

Tekan tombol **Tes Koneksi** di layar itu. Hasilnya menunjukkan bagian mana yang gagal:

- **Kunci API tidak cocok:** kunci di aplikasi berbeda dengan `KUNCI_API` di `Code.gs`. Samakan, jalankan fungsi `setup()` lagi, lalu **Ubah Koneksi** dan isi kunci yang benar.
- **Backend belum diperbarui:** `Code.gs` baru belum di-deploy. Pilih **Terapkan > Kelola deployment > pensil > Versi baru > Terapkan**.
- **Bukan JSON / meminta login Google / gagal tersambung:** URL salah (harus berakhiran `/exec`), atau akses belum **Siapa saja (Anyone)**. Perbaiki di **Terapkan > Kelola deployment**.

## Login awal

Username `admin`, password `admin123`. **Segera ganti** di Pengaturan > Akun & Pengguna.

## Memperbarui aplikasi

Ganti isi `index.html` di repositori dengan versi baru (tombol **Add file > Upload files**, nama file sama), lalu commit. Jika tampilan lama masih muncul, tutup dan buka lagi aplikasinya.

## Catatan keamanan

- Password pengguna disimpan sebagai teks biasa di data aplikasi. Batasi siapa yang memegang Google Sheet atau perangkatnya.
- Kunci API Apps Script tersimpan di browser tiap perangkat. Jangan bagikan kunci itu.
- Cetak Bluetooth hanya berjalan di Chrome Android dan membutuhkan HTTPS (GitHub Pages sudah HTTPS).

## Pemecahan masalah

- **Halaman kosong setelah deploy:** pastikan `index.html` ada di root repositori dan Pages sudah aktif di Settings > Pages.
- **"Gagal terhubung" di layar Koneksi:** cek URL berakhiran `/exec`, kunci API sama dengan di `Code.gs`, dan akses Web App diatur *Anyone*. Setelah mengubah script, lakukan **Deploy ulang** (New version).
- **Data tidak muncul di perangkat lain:** pastikan semua perangkat memakai URL dan kunci yang sama.
