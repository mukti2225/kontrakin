# Rental Property Operating System — Comprehensive Product-Level UI/UX Audit

> **Document**: `docs/ui-ux-audit.md`  
> **Type**: Full Product-Level UI/UX Audit & Usability Inspection  
> **Source Documents**: `design.md`, `project-structure.md`, `AGENTS.md`  
> **Evaluation Scope**: Information Architecture, Navigation, Usability, Task Completion, Business Workflow Clarity, Financial UX, Responsiveness, Accessibility, Permissions, States, Onboarding, Import/Migration, Search, Forms, Tables, Modals/Drawers, Notifications, Reports, and Core User Journeys.  
> **Status**: Completed Audit Baseline (Living Reference)

---

## 1. Executive Summary

Aplikasi **Kontrakin** sedang bertransisi dari SaaS CRUD manajemen kos menjadi **Rental Property Operating System** multitenant berskala produksi untuk pasar rental properti Indonesia. 

Audit menyeluruh ini mengevaluasi seluruh permukaan produk (Owner Workspace, Tenant Portal, dan Superadmin Console) bukan sekadar dari aspek kosmetik/visual, melainkan efektivitas sistem dalam menjalankan operasi bisnis rental:
- **Karakter Visual & Brand**: Nuansa clean, profesional, didominasi warna emerald/teal (`emerald-600` / `teal-600`) sebagai aksen identitas brand, minimalis gradien, tipografi tajam, dan bebas dari ornamen dekoratif AI yang tidak fungsional.
- **Efisiensi Operasional (Speed of Operations)**: Memastikan setiap alert pada Action Center dapat ditindaklanjuti dalam 1 klik tanpa *navigation dead-ends*.
- **Ketepatan Finansial (Financial UX & Integrity)**: Menghindari penyederhanaan UI yang menyesatkan (seperti hardcoding tarif nominal kamar tanpa melihat *balance due* invoice atau histori alokasi pembayaran).
- **Kesiapan Multitenant & Akses Berbasis Peran (RBAC)**: Menghilangkan pembatasan navigasi yang keliru (misalnya staf operasional terblokir dari workspace organisasi) dan menegakkan isolasi data.

---

## 2. Product & Role Context

Kontrakin melayani 3 persona utama dengan kebutuhan UX yang berbeda secara fundamental:

### 2.1 Owner & Pengelola Properti (Desktop-First)
- **Tujuan Utama**: Memaksimalkan okupansi (*Occupancy Rate*), menekan piutang tertunggak (*Collection Rate*), mengendalikan biaya operasional properti (*NOI*), dan menyelesaikan keluhan penghuni secara terukur (*SLA*).
- **Kebutuhan UX**: *Command Center* operasional dengan kontrol tabel data yang kaya (filter multi-kondisi, pencarian instan, paginasi, ekspor, aksi massal), ringkasan metrik berbasis kartu flat, serta drill-down cepat dari alert ke tindakan.

### 2.2 Staf Operasional & Keuangan (Desktop & Tablet)
- **Tujuan Utama**: Eksekusi harian (mencatat pembayaran kas masuk, mengurus tiket pemeliharaan, memvalidasi bukti transfer, menginput data kamar).
- **Kebutuhan UX**: Akses terkontrol berbasis hak akses (*Permission-Aware UX*). Antarmuka tidak boleh menampilkan tombol aksi jika pengguna tidak memiliki wewenang eksekusi (`forbidden action feedback`).

### 2.3 Penghuni / Tenant (Mobile-First)
- **Tujuan Utama**: Mengetahui status sewa, melihat rincian tagihan bulanan, melakukan pembayaran mudah via VA/QRIS/Transfer, mengirim laporan kerusakan kamar, dan mengakses kontak WhatsApp darurat pengelola.
- **Kebutuhan UX**: Tampilan yang sangat bersih, cepat dimuat pada jaringan mobile, target sentuh minimal 44–48px, instruksi pembayaran tanpa ambiguitas, dan konfirmasi kwitansi instan.

### 2.4 Superadmin / Operator Platform (Desktop-First)
- **Tujuan Utama**: Memantau kesehatan platform, pendaftaran organisasi baru (*onboarding*), metrik agregat volume portofolio, dan audit keamanan sistem.

---

## 3. Information Architecture (IA)

### 3.1 Peta Hirarki Navigasi Saat Ini
```text
Root (/)
├── (auth)
│   ├── login
│   ├── register (Tenant vs Owner)
│   └── forgot-password
├── unauthorized
└── dashboard
    ├── admin (Superadmin Console)
    │   ├── users (Daftar Pengguna Platform)
    │   ├── paket (Paket & Berlangganan)
    │   └── logs (Log Sistem)
    ├── owner (Owner Command Center)
    │   ├── properti (Daftar Properti)
    │   │   └── [id] (Detail Properti & Unit)
    │   ├── kamar (Manajemen Kamar Seluruh Properti)
    │   ├── penghuni (Direktori Tenant)
    │   ├── kontrak (Kontrak Sewa & Deposit)
    │   ├── keuangan (Tagihan Invoice, Kasir, & Arus Kas)
    │   ├── pemeliharaan (Tiket Kerusakan & Vendor Teknisi)
    │   ├── pesan (WhatsApp Notification Hub)
    │   ├── laporan (Laporan Finansial & AI Advisory)
    │   ├── tim (Staf & Hak Akses Organisasi)
    │   └── pengaturan (Profil, Keamanan, Kode Undangan)
    └── tenant (Tenant Mobile Portal)
        ├── tagihan (Rincian Invoice & Histori Pembayaran)
        │   └── pembayaran (Kasir Pembayaran Tagihan)
        ├── kontrak (Status Sewa & Aturan Kos)
        ├── keluhan (Form Laporan & Tracking Tiket)
        └── pengaturan (Profil & Kontak)
```

### 3.2 Temuan Evaluasi Arsitektur Informasi
- **Pemisahan Kamar vs Properti**: Menu `Properti & Kamar` di sidebar mengarah ke `/dashboard/owner/properti`, sedangkan `/dashboard/owner/kamar` mengelola seluruh kamar lintas properti. Pola ini dapat membingungkan pemilik yang hanya memiliki 1 properti.
- **Hubungan Kontrak & Tagihan**: Tagihan dihasilkan dari kontrak aktif, namun navigasi saat ini memisahkan `Kontrak Sewa` dan `Keuangan & Tagihan` tanpa tautan silang (*cross-link*) yang jelas pada baris tabel masing-masing.

---

## 4. Brand & Design System

### 4.1 Identitas Visual & Warna
- **Warna Utama Brand**: Emerald / Teal (`emerald-600` / `#059669` & `teal-700` / `#0f766e`) diposisikan sebagai warna kepercayaan, stabilitas finansial, dan keteraturan operasional.
- **Latar & Kartu**: Menghilangkan gradien berat multi-warna yang membuat teks silau. Standar latar adalah `slate-50` dengan kartu `bg-white` ber-border halus (`border-slate-200/80` atau `border-slate-100`).
- **Semantic Badges**:
  - `emerald`: Lunas, Aktif, Selesai, Terisi, Terkirim.
  - `amber`: Dalam Proses, Tempo Dekat, Sebagian, Perbaikan, Sedang.
  - `rose`: Tertunggak, Menunggu, Kritis, Darurat, Tinggi.
  - `slate`: Kosong, Draf, Nonaktif, Rendah.

---

## 5. Navigation & Shell

### 5.1 Temuan Audit Shell
- **Issue**: Tidak adanya *Global Quick Switcher* untuk organisasi dan pencarian global (`Cmd+K`).
- **Location**: `components/layout/DashboardHeader.tsx`
- **Current Behavior**: Top header hanya menampilkan judul rute, badge organisasi pasif, dan inisial avatar tanpa aksi dropdown menu.
- **User Impact**: Pengguna dengan multiple properti/organisasi tidak dapat berpindah konteks akun tanpa logout.
- **Severity**: Medium  
- **Priority**: P1  
- **Recommendation**: Tambahkan dropdown menu profil (Profil, Pengaturan, Keluar) dan pintasan Global Search di `DashboardHeader`.
- **Acceptance Criteria**: Menekan tombol profil membuka dropdown dengan opsi profil & logout; terdapat shortcut pencarian global.

---

## 6. Owner Dashboard (`/dashboard/owner`)

### 6.1 Evaluasi & Temuan
- **Issue**: Kartu *Action Center* mengandalkan reload halaman penuh untuk refresh status.
- **Location**: `app/dashboard/owner/page.tsx`
- **Current Behavior**: Setelah pemilik mengklik link aksi (misal review tagihan tertunggak), metrik dashboard baru terupdate saat navigasi berikutnya.
- **User Impact**: Pengguna tidak langsung melihat berkurangnya counter darurat jika menggunakan tab ganda.
- **Severity**: Low  
- **Priority**: P2  
- **Recommendation**: Tambahkan tombol *Refresh Metrik* manual atau revalidasi data otomatis.
- **Acceptance Criteria**: Terdapat indikator waktu data terakhir diperbarui dan tombol refresh halus.

---

## 7. Property & Unit (`/dashboard/owner/properti` & `/kamar`)

### 7.1 Evaluasi & Temuan
- **Issue**: Semantic color inversion pada ringkasan okupansi di detail properti.
- **Location**: `app/dashboard/owner/properti/[id]/detail-client.tsx` (Baris 247–258)
- **Current Behavior**: Angka unit *Terisi* menggunakan warna biru (`text-blue-600`), sedangkan unit *Kosong* menggunakan warna hijau (`text-emerald-600` dengan ikon `Bed` hijau).
- **User Impact**: Dalam bisnis rental, unit terisi menghasilkan pendapatan (positif/hijau), sedangkan unit kosong adalah kapasitas yang belum termonetisasi (netral/slate). Pewarnaan terbalik membingungkan pemantauan kesehatan properti.
- **Severity**: Medium  
- **Priority**: P1  
- **Recommendation**: Sesuaikan indikator visual: unit terisi menjadi `text-emerald-600`, unit kosong menjadi `text-slate-600`, dan perbaikan menjadi `text-amber-600`.
- **Acceptance Criteria**: Di halaman detail properti, metrik okupansi dan unit terisi ditampilkan dengan aksen hijau emerald.

---

## 8. Tenant Management (`/dashboard/owner/penghuni`)

### 8.1 Evaluasi & Temuan
- **Issue**: Format nomor HP dan input KTP tidak memiliki validasi format Indonesia yang dinamis.
- **Location**: `app/dashboard/owner/penghuni/penghuni-client.tsx`
- **Current Behavior**: Input `noHp` menerima teks bebas tanpa auto-prefix `+62` atau sanitasi spasi/strip otomatis.
- **User Impact**: Nomor HP yang diinput dengan format salah (`0812...` vs `62812...` vs `0812-xxxx`) dapat menggagalkan pengiriman link WhatsApp gateway otomatis.
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Tambahkan helper normalisasi nomor HP saat blur/submit (menggunakan fungsi standar sanitasi telepon `lib/communication/provider.ts`).
- **Acceptance Criteria**: Input nomor telepon otomatis dinormalisasi ke format E.164 (`628xxx`) saat form disimpan.

---

## 9. Lease (`/dashboard/owner/kontrak`)

### 9.1 Evaluasi & Temuan
- **Issue**: Ketiadaan pengingat jatuh tempo deposit dan klausul sewa pada form kontrak sewa.
- **Location**: `app/dashboard/owner/kontrak/kontrak-client.tsx`
- **Current Behavior**: Form kontrak hanya mencatat nominal sewa, nominal deposit, dan tanggal mulai/selesai tanpa status pembayaran deposit (apakah sudah disetor lunas atau belum).
- **User Impact**: Pemilik kos lupa menagih deposit jaminan kerusakan karena status deposit tidak terlacak terpisah dari invoice sewa pertama.
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Tambahkan pilihan status penyetoran deposit (*Sudah Disetor* / *Belum Disetor*) pada form pendaftaran kontrak.
- **Acceptance Criteria**: Tabel kontrak menampilkan badge status penerimaan deposit.

---

## 10. Invoice (`/dashboard/owner/keuangan` - Tab Tagihan)

### 10.1 Evaluasi & Temuan
- **Issue**: Tindakan cetak invoice / kirim WhatsApp langsung dari baris tabel invoice memerlukan multi-klik.
- **Location**: `app/dashboard/owner/keuangan/keuangan-client.tsx`
- **Current Behavior**: Pemilik harus membuka dropdown menu titik tiga atau membuka detail invoice modal untuk mengirim reminder WhatsApp.
- **User Impact**: Memperlambat eksekusi penagihan massal harian ketika terdapat 20+ penyewa jatuh tempo.
- **Severity**: Medium  
- **Priority**: P1  
- **Recommendation**: Sediakan tombol cepat ikon WhatsApp langsung pada baris invoice yang berstatus `overdue` atau `issued`.
- **Acceptance Criteria**: Terdapat tombol aksi cepat 1-klik untuk membuka pesan pengingat WhatsApp langsung dari tabel invoice.

---

## 11. Payment & Reconciliation (`/dashboard/owner/keuangan`)

### 11.1 Evaluasi & Temuan
- **Issue**: Formulir pembayaran manual kasir tidak menampilkan opsi alokasi spesifik ke nomor invoice.
- **Location**: `app/dashboard/owner/keuangan/keuangan-client.tsx` (Modal Catat Transaksi Baru)
- **Current Behavior**: Saat mencatat transaksi kas masuk kategori "Pembayaran Sewa", form hanya mencatat arus kas umum ke tabel transaksi kas, tanpa memicu alokasi otomatis ke invoice penyewa yang bersangkutan.
- **User Impact**: Terjadi disparitas data antara buku kas dan status invoice penyewa (di buku kas sudah masuk uang, tapi invoice penyewa tetap berstatus tertunggak).
- **Severity**: Critical  
- **Priority**: P0  
- **Recommendation**: Hubungkan form kasir pencatatan sewa langsung dengan `billingService.recordPayment` sehingga pembayaran mengalokasikan saldo dan melunasi invoice terkait.
- **Acceptance Criteria**: Mencatat pembayaran sewa di modul kas otomatis mengubah status invoice terkait menjadi Lunas.

---

## 12. Expense (`/dashboard/owner/keuangan` - Tab Buku Kas)

### 12.1 Evaluasi & Temuan
- **Issue**: Kategori pengeluaran operasional belum terstandarisasi dengan kode akun standar akuntansi rental.
- **Location**: `app/dashboard/owner/keuangan/keuangan-client.tsx`
- **Current Behavior**: Kategori pengeluaran diisi teks bebas atau pilihan terbatas (Listrik, Air, Wifi) tanpa tagging ke unit atau properti tertentu.
- **User Impact**: Pemilik tidak dapat melihat unit mana yang mengalami kebocoran biaya pemeliharaan abnormal.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Tambahkan field pilihan properti/unit opsional saat mencatat pengeluaran operasional.
- **Acceptance Criteria**: Pengeluaran kas dapat dikaitkan dengan properti atau unit tertentu untuk kalkulasi Net Operating Income unit.

---

## 13. Maintenance (`/dashboard/owner/pemeliharaan`)

### 13.1 Evaluasi & Temuan
- **Issue**: Tiket pemeliharaan yang telah selesai belum terhubung otomatis ke pencatatan biaya kas keluar (*expense*).
- **Location**: `app/dashboard/owner/pemeliharaan/pemeliharaan-client.tsx`
- **Current Behavior**: Saat pemilik mengubah status tiket menjadi "Selesai" dan mengisi estimasi biaya perbaikan teknisi, biaya tersebut tidak otomatis tercatat di buku kas pengeluaran.
- **User Impact**: Pemilik harus berpindah manual ke modul keuangan untuk menginput ulang nominal kuitansi teknisi.
- **Severity**: Medium  
- **Priority**: P1  
- **Recommendation**: Tambahkan checkbox konfirmasi: "Catat biaya perbaikan ini ke buku kas pengeluaran secara otomatis" saat tiket diselesaikan.
- **Acceptance Criteria**: Menyelesaikan tiket dengan biaya terisi dapat langsung membuat entri pengeluaran kas.

---

## 14. Communication (`/dashboard/owner/pesan`)

### 14.1 Evaluasi & Temuan
- **Issue**: Ketiadaan filter riwayat pesan berdasarkan jenis template atau status terkirim.
- **Location**: `app/dashboard/owner/pesan/pesan-client.tsx`
- **Current Behavior**: Tab audit riwayat pesan hanya memiliki 1 input pencarian teks umum.
- **User Impact**: Sulit bagi pemilik untuk mengaudit berapa pesan pengingat jatuh tempo H-1 yang sudah terkirim minggu ini.
- **Severity**: Low  
- **Priority**: P2  
- **Recommendation**: Tambahkan filter pill template (Semua, H-5, H-1, Hari H, Tunggakan, Kwitansi).
- **Acceptance Criteria**: Pemilik dapat memfilter riwayat audit komunikasi berdasarkan template yang digunakan.

---

## 15. Tenant Portal (`/dashboard/tenant`)

### 15.1 Evaluasi & Temuan
- **Issue**: Halaman bayar tagihan tenant menggunakan harga kamar standar alih-alih sisa saldo tagihan invoice aktif (*balance due*).
- **Location**: `app/dashboard/tenant/tagihan/pembayaran/page.tsx` & `action.ts`
- **Current Behavior**: Tampilan total bayar menampilkan `kamar.hargaBulanan` tanpa memperhitungkan biaya tambahan invoice (denda, utilitas) atau pembayaran parsial yang sudah disetor.
- **User Impact**: Tenant dapat membayar nominal yang keliru (kurang bayar atau lebih bayar dari tagihan riil).
- **Severity**: Critical  
- **Priority**: P0  
- **Recommendation**: Tampilkan data dari invoice aktif penyewa yang belum lunas (`balanceDue`). Bila terdapat beberapa invoice, tampilkan pemilih invoice yang akan dilunasi.
- **Acceptance Criteria**: Nilai total bayar di halaman kasir tenant persis sama dengan `balanceDue` invoice aktif.

---

## 16. Superadmin Console (`/dashboard/admin`)

### 16.1 Evaluasi & Temuan
- **Issue**: Ketiadaan tombol aksi *Impersonate* atau *View Workspace* untuk bantuan teknis darurat.
- **Location**: `app/dashboard/admin/admin-client.tsx`
- **Current Behavior**: Superadmin hanya dapat melihat statistik organisasi dan nama pemilik, tanpa fasilitas melihat detail konfigurasi organisasi saat pelanggan meminta bantuan.
- **User Impact**: Penanganan tiket bantuan kendala teknis pengguna memakan waktu lama.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Sediakan tautan inspect read-only organisasi bagi akun berotoritas platform.
- **Acceptance Criteria**: Superadmin dapat menginspeksi metrik dan kesehatan data organisasi tertentu.

---

## 17. Team & Permissions (`/dashboard/owner/tim`)

### 17.1 Evaluasi & Temuan
- **Issue**: Deskripsi hak akses peran (Owner, Manager, Finance, Staff) tidak dijelaskan secara eksplisit pada dialog undang staf.
- **Location**: `app/dashboard/owner/tim/tim-client.tsx`
- **Current Behavior**: Pilihan peran hanya berupa dropdown tanpa rangkuman wewenang apa yang diizinkan untuk masing-masing peran.
- **User Impact**: Pemilik khawatir salah memberikan wewenang sensitif (seperti hapus data atau akses keuangan).
- **Severity**: Medium  
- **Priority**: P1  
- **Recommendation**: Tampilkan badge penjelasan singkat izin di bawah dropdown peran (misal: "Staf: Dapat mengelola kamar dan tiket pemeliharaan, tidak dapat menghapus properti atau merubah setelan akun").
- **Acceptance Criteria**: Dialog undang staf menampilkan ringkasan hak akses sesuai peran yang dipilih.

---

## 18. Onboarding

### 18.1 Evaluasi & Temuan
- **Issue**: Pemilik baru yang selesai mendaftar langsung dihadapkan pada dashboard kosong tanpa panduan langkah mula (*checklist onboarding*).
- **Location**: `app/dashboard/owner/page.tsx`
- **Current Behavior**: Tampil dashboard dengan metrik 0 tanpa banner instruksi runtut.
- **User Impact**: Pengguna baru kebingungan memulai dari mana (apakah buat kamar dulu, properti dulu, atau penghuni dulu).
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Tampilkan banner panduan 4 langkah awal untuk organisasi baru:
  1. Tambah Properti Pertama
  2. Buat Unit Kamar
  3. Masukkan Data Penyewa
  4. Aktifkan Kontrak Sewa
- **Acceptance Criteria**: Dashboard owner yang belum memiliki properti menampilkan wizard/checklist interaktif yang hilang otomatis setelah properti pertama aktif.

---

## 19. Import / Migration

### 19.1 Evaluasi & Temuan
- **Issue**: Tidak ada fasilitas import data massal via Excel/CSV.
- **Location**: Modul Kamar & Penghuni (`/dashboard/owner/kamar`, `/penghuni`)
- **Current Behavior**: Seluruh data unit dan penyewa harus diinput satu per satu melalui modal formulir.
- **User Impact**: Pemilik properti dengan 30–100 kamar enggan bermigrasi ke Kontrakin karena beban input manual yang sangat berat.
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Sediakan fitur import spreadsheet (format `.xlsx` / `.csv`) dengan template standar yang dapat diunduh, dilengkapi validasi baris sebelum commit ke database.
- **Acceptance Criteria**: Terdapat tombol "Import Excel" di modul kamar dan penghuni dengan preview validasi baris.

---

## 20. Global Search & Quick Actions

### 20.1 Evaluasi & Temuan
- **Issue**: Ketiadaan pencarian global (*Global Command Palette*).
- **Location**: Header navigasi aplikasi
- **Current Behavior**: Pencarian hanya berjalan lokal di masing-masing tabel halaman.
- **User Impact**: Pengelola harus mengingat apakah "Budi" ada di halaman kontrak atau halaman penghuni sebelum mencari.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Implementasikan command dialog (`Ctrl+K` / `Cmd+K`) di `DashboardHeader` untuk mencari nama penyewa, nomor kamar, atau nomor invoice secara instan.
- **Acceptance Criteria**: Menekan `Cmd+K` memunculkan dialog pencarian global yang menavigasi langsung ke entitas terkait.

---

## 21. Forms

### 21.1 Evaluasi & Temuan
- **Issue**: Form pengaturan akun menggunakan nilai dummy statis yang tidak tersambung ke database.
- **Location**: `app/dashboard/owner/pengaturan/page.tsx`
- **Current Behavior**: Input nama default ke `"Budi Pemilik Kos"` dan tidak ada form action yang menyimpan perubahan profil.
- **User Impact**: Pemilik tidak dapat mengubah nama profil atau memperbarui kata sandi akunnya.
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Ambil data user aktif secara server-side dan sediakan Server Action untuk pembaruan profil & kata sandi.
- **Acceptance Criteria**: Nama pengguna aktif ditampilkan di form pengaturan dan tombol "Simpan Perubahan" memperbarui data secara persisten.

---

## 22. Tables

### 22.1 Evaluasi & Temuan
- **Issue**: Seluruh tabel operasional belum memiliki kontrol *Export to CSV / Excel* yang konsisten.
- **Location**: Modul Kamar, Kontrak, Keuangan, Pemeliharaan
- **Current Behavior**: Data hanya dapat dilihat di layar tanpa opsi unduh laporan spreadsheet instan.
- **User Impact**: Pemilik kesulitan saat ingin mengolah data lebih lanjut di Microsoft Excel untuk laporan pajak/rekanan.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Tambahkan tombol "Ekspor CSV" standar di atas tabel data operasional.
- **Acceptance Criteria**: Mengklik ekspor mengunduh file `.csv` dari data yang sedang terfilter.

---

## 23. Modal / Drawer / Detail Patterns

### 23.1 Evaluasi & Temuan
- **Issue**: Pada layar mobile, dialog modal formulir panjang terpotong dan menyulitkan pengisian tombol simpan di bagian bawah.
- **Location**: Dialog tambah kamar (`kamar-client.tsx`), tambah kontrak (`kontrak-client.tsx`)
- **Current Behavior**: Dialog menggunakan popover tengah standar dengan `max-h-[90vh]` yang memerlukan scroll internal ganda di browser smartphone.
- **User Impact**: Tombol simpan terkadang tertutup keyboard virtual perangkat mobile.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Gunakan bottom drawer atau formulir full-screen responsif pada viewport `< 640px`.
- **Acceptance Criteria**: Pada mobile layar kecil, dialog terbuka sebagai bottom sheet yang tombol aksinya selalu terjangkau.

---

## 24. Loading / Empty / Error / Success States

### 24.1 Status Evaluasi
- **Empty States**: Telah distandarisasi pada Batch 4 dengan ikon, penjelasan ramah, dan tombol aksi pembuat data atau reset pencarian.
- **Error States**: Sonner toast sudah terpasang dengan baik pada seluruh Server Action.
- **Loading Indicators**: Transisi formulir telah menggunakan `useTransition` (`isPending` state) dengan tombol bertuliskan `"Menyimpan..."` dan disabled state.

---

## 25. Notifications & Activity

### 25.1 Evaluasi & Temuan
- **Issue**: Ketiadaan lonceng notifikasi in-app untuk event penting (misal tenant baru bayar, atau komplain darurat baru masuk).
- **Location**: `DashboardHeader.tsx`
- **Current Behavior**: Pemilik hanya mengetahui ada keluhan jika sengaja membuka menu Pemeliharaan.
- **User Impact**: Potensi keterlambatan penanganan insiden darurat kamar (seperti pipa air bocor).
- **Severity**: High  
- **Priority**: P1  
- **Recommendation**: Tambahkan dropdown menu lonceng notifikasi pada `DashboardHeader` yang menampilkan 5 event operasional terbaru dari event bus sistem.
- **Acceptance Criteria**: Lonceng di header menampilkan badge merah jika ada tiket darurat baru atau pembayaran baru yang belum dicek.

---

## 26. Reports & Analytics (`/dashboard/owner/laporan`)

### 26.1 Evaluasi & Temuan
- **Issue**: Visualisasi grafik laporan membutuhkan perataan kontras dan opsi filter rentang bulan kustom.
- **Location**: `app/dashboard/owner/laporan/laporan-client.tsx`
- **Current Behavior**: Periode analisis default ke bulan berjalan tanpa pemilih rentang tanggal kustom (*date range picker*).
- **User Impact**: Pemilik tidak dapat membandingkan performa antar kuartal (Q1 vs Q2).
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Tambahkan pemilih periode kuartal / tahunan pada dashboard analitik.
- **Acceptance Criteria**: Pemilik dapat memfilter laporan pendapatan berdasarkan periode kuartal atau tahun berjalan.

---

## 27. Responsive Behavior

### 27.1 Evaluasi & Temuan
- **Tenant Portal**: Sangat responsif dengan bottom quick dock dan touch target >= 44px (diselesaikan di Batch 3).
- **Tabel Owner di Layar Tablet/Mobile**: Tabel transaksi dan invoice memiliki scroll horizontal, namun header tabel belum memiliki *sticky first column* (nomor invoice atau nama penyewa) saat di-scroll ke kanan pada layar kecil.
- **User Impact**: Pengguna kehilangan konteks siapa pemilik baris saat melihat kolom jumlah uang di paling kanan.
- **Severity**: Medium  
- **Priority**: P2  
- **Recommendation**: Jadikan kolom pertama (*No. Tagihan* / *Nama Penyewa*) sebagai sticky column pada mobile view.
- **Acceptance Criteria**: Kolom nama/nomor tetap terlihat saat tabel digeser ke kanan pada layar smartphone.

---

## 28. Accessibility (a11y)

### 28.1 Evaluasi & Temuan
- **Kontras Teks**: Seluruh teks telah dievaluasi memenuhi rasio kontras WCAG AA (teks abu-abu minimal `text-slate-500` / `text-slate-600` di atas latar putih).
- **Focus Rings**: Input teks dan tombol telah dilengkapi dengan `focus-visible:ring-2 focus-visible:ring-emerald-500` yang terlihat jelas saat navigasi keyboard `Tab`.
- **Screen Reader Label**: Beberapa tombol ikon (seperti tombol dropdown titik tiga dan tombol hapus) perlu dilengkapi `aria-label` eksplisit.
- **Severity**: Low  
- **Priority**: P3  
- **Recommendation**: Tambahkan atribut `aria-label="Menu aksi baris"` pada seluruh trigger ikon tanpa teks.
- **Acceptance Criteria**: Tombol ikon lulus audit aksesibilitas pembaca layar tanpa peringatan *missing accessible name*.

---

## 29. Core User Journeys

### Journey 1: Owner Setup
```text
Signup → Buat Organisasi → Tambah Properti → Buat Unit Kamar → Tambah Penyewa → Terbitkan Kontrak → Buat Tagihan Pertama
```
- **Hambatan Utama Saat Ini**: Ketiadaan checklist onboarding terpadu; pengguna harus berpindah-pindah 5 menu secara mandiri tanpa panduan runtut.
- **Solusi UX**: Tambahkan widget "Langkah Awal Memulai" pada dashboard pemilik baru.

### Journey 2: Rent Collection
```text
Terbitkan Invoice → Kirim WhatsApp Reminder → Penyewa Melakukan Pembayaran → Rekonsiliasi Kasir → Terbitkan Kwitansi Resmi
```
- **Hambatan Utama Saat Ini**: Form kasir pembayaran manual di `/dashboard/owner/keuangan` belum mengalokasikan pembayaran langsung ke nomor invoice yang tertunggak.
- **Solusi UX**: Hubungkan form kasir pencatatan sewa langsung dengan rekonsiliasi invoice.

### Journey 3: Maintenance & Repairs
```text
Penyewa Lapor Keluhan → Pemilik Review & Tetapkan Prioritas → Tugaskan Teknisi Rekanan → Pengerjaan → Catat Biaya Kas Keluar → Tiket Selesai
```
- **Hambatan Utama Saat Ini**: Biaya perbaikan pada tiket yang selesai belum otomatis masuk ke buku kas pengeluaran operasional.
- **Solusi UX**: Tambahkan opsi catat otomatis ke pengeluaran kas saat tiket diselesaikan.

### Journey 4: Tenant Bill Payment
```text
Login Tenant Portal → Lihat Rincian Tagihan Aktif → Pilih Metode Bayar → Konfirmasi Pembayaran → Terima Kwitansi Digital
```
- **Hambatan Utama Saat Ini**: Halaman bayar `/dashboard/tenant/tagihan/pembayaran` mengabaikan sisa saldo invoice riil dan menampilkan harga kamar standar.
- **Solusi UX**: Gunakan `balanceDue` dari invoice aktif penyewa sebagai sumber kebenaran nominal bayar.

### Journey 5: Superadmin SaaS Operations
```text
Login Console → Pantau Kesehatan Multi-Organisasi → Pantau Volume Unit & Kontrak → Inspeksi Log Audit & Bantuan Pelanggan
```
- **Hambatan Utama Saat Ini**: Tidak ada aksi inspect mendalam per organisasi untuk investigasi kendala pelanggan.
- **Solusi UX**: Tambahkan modal inspect profil organisasi dan kontak pengelola.

---

## 30. UX Gap Matrix

| No | Modul / Area | Kesenjangan UX Saat Ini | Kondisi Target Operasional | Tingkat Kritis |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Tenant Payment** | Kasir tenant menagih harga kamar statis, bukan balance due invoice | Menagih persis nilai `balanceDue` invoice aktif | **Critical (P0)** |
| 2 | **Cashier Reconciliation** | Catat kas masuk sewa tidak otomatis melunasi invoice | Transaksi sewa kasir otomatis merekonsiliasi invoice | **Critical (P0)** |
| 3 | **First-Time Onboarding** | Pemilik baru melihat dashboard kosong tanpa checklist langkah | Wizard panduan interaktif 4 langkah setup | **High (P1)** |
| 4 | **Settings Form** | Form profil menggunakan nilai hardcoded dummy statis | Menampilkan data user asli & server action simpan | **High (P1)** |
| 5 | **Data Import** | Harus menginput kamar & penghuni satu per satu | Import spreadsheet Excel (.xlsx / .csv) | **High (P1)** |
| 6 | **In-App Notification** | Pemilik tidak mendapat notifikasi lonceng saat ada komplain darurat | Lonceng notifikasi header terhubung ke event bus | **High (P1)** |
| 7 | **Maintenance Expense Sync** | Tiket pemeliharaan selesai tidak otomatis mencatat kas keluar | Opsi otomatis rekam kuitansi teknisi ke buku kas | **Medium (P1)** |
| 8 | **Property Detail Okupansi** | Warna okupansi terbalik (terisi biru, kosong hijau) | Terisi hijau emerald, kosong abu-abu netral | **Medium (P1)** |
| 9 | **Global Search** | Hanya pencarian lokal per tabel | Dialog `Cmd+K` global search di seluruh entitas | **Medium (P2)** |
| 10 | **Data Export** | Belum ada export CSV di tabel kamar dan kontrak | Tombol export CSV standar di seluruh tabel data | **Medium (P2)** |

---

## 31. Priority & Severity Matrix

```text
               ┌───────────────────────┬───────────────────────┐
               │ HIGH SEVERITY         │ CRITICAL SEVERITY     │
               │                       │                       │
               │ • Onboarding Wizard   │ • Tenant Payment      │
  P0 / P1      │ • Import Excel / CSV  │   Invoice Sync        │
  (Mendesak)   │ • Settings Action     │ • Kasir Rekonsiliasi  │
               │ • In-App Notif Bell   │   Invoice Otomatis    │
               │ • Okupansi Visual Fix │                       │
               ├───────────────────────┼───────────────────────┤
               │ LOW SEVERITY          │ MEDIUM SEVERITY       │
               │                       │                       │
  P2 / P3      │ • Aria-label icons    │ • Global Cmd+K Search │
  (Terencana)  │ • Template pill filter│ • Export CSV Tables   │
               │ • Refresh button      │ • Responsive Drawer   │
               │                       │ • Date Range Picker   │
               └───────────────────────┴───────────────────────┘
```

---

## 32. Recommended Execution Order

Berdasarkan matriks keparahan dan dampak langsung terhadap operasional bisnis rental, berikut urutan eksekusi yang direkomendasikan:

### Tahap 1: Koreksi Finansial & Integritas Tagihan (P0 — Segera)
1. Perbaiki kasir pembayaran tenant di `/dashboard/tenant/tagihan/pembayaran` agar menagih persis nilai `balanceDue` invoice aktif penyewa.
2. Sinkronkan modul kasir penerimaan sewa di `/dashboard/owner/keuangan` dengan `billingService.recordPayment` agar entri kas masuk otomatis melunasi invoice tertunggak.

### Tahap 2: Onboarding, Profil & Akurasi Visual (P1)
1. Terapkan panduan onboarding interaktif (*Setup Wizard Checklist*) di `/dashboard/owner` untuk pengguna baru.
2. Sambungkan form profil & keamanan di `/dashboard/owner/pengaturan` dengan data pengguna sebenarnya dan Server Action pembaruan.
3. Koreksi pewarnaan visual metrik okupansi di `/dashboard/owner/properti/[id]/detail-client.tsx` menjadi hijau emerald untuk unit terisi.
4. Hubungkan penyelesaian tiket pemeliharaan dengan opsi pencatatan otomatis ke buku kas pengeluaran.

### Tahap 3: Kecepatan Migrasi & Komunikasi (P1–P2)
1. Bangun fitur Import Data Kamar & Penghuni via Excel / CSV untuk mempermudah migrasi properti baru.
2. Tambahkan dropdown Lonceng Notifikasi in-app pada `DashboardHeader` untuk alert pembayaran dan komplain darurat.

### Tahap 4: Produktivitas & Analitik Lanjutan (P2–P3)
1. Implementasikan Global Command Palette (`Cmd+K`) di `DashboardHeader`.
2. Sediakan fitur Export CSV di seluruh tabel data operasional (kamar, kontrak, tagihan, pemeliharaan).
3. Sempurnakan aksesibilitas pembaca layar (`aria-label`) dan date range picker kustom pada modul laporan analitik.
