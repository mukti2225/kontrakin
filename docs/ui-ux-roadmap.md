# Rental Property Operating System — UI/UX Roadmap

> **Document**: `docs/ui-ux-roadmap.md`  
> **Purpose**: Roadmap eksekusi peningkatan antarmuka dan pengalaman pengguna berdasarkan temuan audit menyeluruh `docs/ui-ux-audit.md` serta arahan `design.md`, `project-structure.md`, dan `AGENTS.md`.  
> **Status**: Living Roadmap (Batches 1–5 Selesai; Batches 6–9 Terencana Sesuai Audit)

---

## 1. Prinsip Utama Desain

1. **Brand Identity**: Warna hijau/teal (`teal-600` / `emerald-600`) sebagai aksen brand utama yang bersih, tenang, dan profesional.
2. **Operational Clarity**: Minimalis dalam penggunaan gradien, hindari styling generic AI-template atau floating decorative blobs.
3. **Hierarchy**: Teks tajam, kontras tinggi (WCAG AA), dan kartu aksi operasional yang jelas.
4. **Responsiveness**: Desktop-first untuk Owner/Superadmin, Mobile-first untuk Tenant Portal.
5. **Speed & Usability**: Setiap alert / card memiliki 1-click drill down ke data terfilter.
6. **Financial Correctness**: Tidak menyederhanakan status akuntansi untuk kenyamanan UI semata; selalu mencerminkan `balanceDue` dan alokasi pembayaran riil.

---

## 2. Status Eksekusi Roadmap

### Batch 1 — Core Shell, Brand & Workspace Header (Selesai)
- [x] **Brand Consistency**: Perbaiki penamaan brand di `components/layout/AppSidebar.tsx` menjadi **Kontrakin** dengan logo resmi dan portal badge.
- [x] **Unified Dashboard Top Bar**: Tambahkan `DashboardHeader` di `app/dashboard/layout.tsx` dengan `SidebarTrigger` (hamburger toggle), breadcrumb lokasi dinamis, badge organisasi aktif, dan avatar profil user.
- [x] **Staff Workspace Access**: Sesuaikan guard di `app/dashboard/owner/page.tsx` agar pengguna berkedudukan `staff` dapat mengakses beranda workspace organisasi.

---

### Batch 2 — Owner Workspace Visual Polish & Action Center Hierarchy (Selesai)
- [x] **Action Center Hierarchy**: Rapikan kartu aksi prioritas di `/dashboard/owner` dengan hierarki tipografi tegas, rasio kontras tinggi, dan tombol review instan.
- [x] **Standardized Badging**: Samakan token status badge (`emerald` untuk lunas/aktif, `amber` untuk proses/tempo dekat, `rose` untuk tunggakan/kritis, `slate` untuk kosong/draf) di seluruh tabel kamar, kontrak, tagihan, dan pemeliharaan melalui `components/ui/status-badge.tsx`.
- [x] **Cleaner Card Styling**: Hilangkan gradien pekat yang tidak perlu, ganti dengan flat-card ber-border lembut dan aksen brand hijau di seluruh workspace metrik.

---

### Batch 3 — Tenant Portal Mobile-First Optimization (Selesai)
- [x] **Touch Target & Spacing**: Optimalkan target sentuh (minimal 44px) untuk tombol aksi bayar, lapor keluhan, dan interaksi formulir di `/dashboard/tenant`.
- [x] **Seamless Navigation**: Sediakan pintasan navigasi mobile cepat (floating quick-action dock untuk mobile), akses 1-tap WhatsApp pengelola, tracking status keluhan, dan riwayat kwitansi pembayaran.

---

### Batch 4 — Standardized Empty States & Accessibility (Selesai)
- [x] **Actionable Empty States**: Pastikan semua empty state (Kamar, Tagihan, Tim, Tiket, Penghuni, Pesan) memiliki instruksi jelas, ikon terpadu, dan tombol aksi penambahan data atau reset filter instan.
- [x] **Focus Rings & Keyboard Navigation**: Pastikan semua interaksi tombol, input teks, dan modal dialog memiliki ring fokus yang terlihat jelas (`focus-visible:ring-2` dan token sistem).

---

### Batch 5 — Table Usability, Responsive Actions & Numbers (Selesai)
- [x] **Tabular Figures & Currency Alignment**: Pastikan seluruh angka moneter (Rupiah), nomor kontrak, dan tanggal menggunakan font mono/tabular figures dengan alignment kanan yang presisi untuk audit finansial yang akurat.
- [x] **Zero Cumulative Layout Shift on Search/Filter**: Filter dan pencarian tabel menjaga kestabilan tata letak antarmuka tanpa layout jump.

---

### Batch 6 — Critical Financial UX & Reconciliation Sync (P0 — Selesai)
- [x] **Tenant Cashier Balance Due Accuracy**: Perbaiki halaman kasir bayar tenant di `/dashboard/tenant/tagihan/pembayaran` dan server action-nya agar menampilkan dan menagih persis sisa tagihan invoice aktif (`balanceDue`), bukan harga sewa kamar statis.
- [x] **Cashbook-to-Invoice Payment Allocation**: Hubungkan formulir pencatatan kas masuk sewa di `/dashboard/owner/keuangan` dengan `billingService.recordPayment` sehingga pembayaran manual kasir otomatis merekonsiliasi dan melunasi invoice penyewa.

---

### Batch 7 — Onboarding Wizard & Account Settings Integrity (P1 — Selesai)
- [x] **First-Time Owner Setup Wizard**: Tampilkan checklist interaktif 4 langkah (Properti → Kamar → Penyewa → Kontrak) di dashboard owner saat belum memiliki data properti aktif.
- [x] **Persistent Account Settings**: Sambungkan form profil dan ganti kata sandi di `/dashboard/owner/pengaturan` dengan data pengguna sebenarnya serta Server Action pembaruan profil yang persisten.
- [x] **Occupancy Visual Fix**: Koreksi pewarnaan kartu okupansi di `/dashboard/owner/properti/[id]/detail-client.tsx` (terisi hijau emerald, kosong slate netral).

---

### Batch 8 — Maintenance Expense Sync & Contact Normalization (P1 — Selesai)
- [x] **Auto Expense on Maintenance Completion**: Sediakan opsi mencatat otomatis kuitansi biaya perbaikan ke buku kas pengeluaran saat tiket pemeliharaan diselesaikan.
- [x] **Indonesian Phone Auto-Formatting**: Terapkan sanitasi dan normalisasi otomatis nomor WhatsApp (`628xxx`) pada form pendaftaran penyewa untuk menjamin keberhasilan pengiriman reminder.

---

### Batch 9 — Mass Migration & Global Operations Productivity (P2 — Selesai)
- [x] **Excel / CSV Import Engine**: Fasilitas import data massal untuk kamar dan penyewa dengan preview validasi baris sebelum commit ke database.
- [x] **Global Command Palette (`Cmd+K`)**: Pencarian global cepat di `DashboardHeader` untuk melompat langsung ke data penyewa, kamar, kontrak, atau invoice.
- [x] **Export to CSV**: Tombol unduh spreadsheet standar di seluruh tabel data operasional (kamar, kontrak, tagihan, pemeliharaan).

---

### Batch 10 — Lease Deposit Sync, Financial Exports & Role Transparency (P1 — Selesai)
- [x] **Lease Deposit Cashbook Integration**: Pembuatan kontrak sewa baru di `/dashboard/owner/kontrak` kini memiliki opsi penerimaan uang jaminan/deposit kerusakan yang langsung tercatat otomatis ke buku kas operasional dengan label kategori `Jaminan Kerusakan` dan audit logging.
- [x] **Deposit Status Badging**: Menampilkan status jaminan deposit (nominal dan status setor) pada tabel daftar kontrak sewa untuk kejelasan akuntansi pemilik.
- [x] **Financial Invoice & Cashbook CSV Export**: Tombol ekspor CSV pada tab Daftar Tagihan dan Catatan Transaksi Kas di `/dashboard/owner/keuangan` dengan format UTF-8 BOM ramah Excel, rincian sisa tagihan, jatuh tempo, serta status lunas/tertunggak.
- [x] **Interactive Team Role Permission Transparency**: Kartu matriks hak akses interaktif pada dialog penambahan staf di `/dashboard/owner/tim`, menampilkan izin yang diberikan vs pembatasan per role (`Staff`, `Manager`, `Finance`).

---

### Batch 11 — Operational Intelligence, Action Center Deep-Linking & Multi-Property Matrix (P1 — Selesai)
- [x] **Month-over-Month Collection Comparison**: Penambahan metrik pertumbuhan penerimaan sewa bulan ini vs bulan lalu (`+X% vs bln lalu`) pada kartu KPI dashboard utama untuk visibilitas arus kas operasional.
- [x] **Multi-Property Performance Matrix**: Kartu portofolio properti interaktif di dashboard owner menampilkan rincian aset per gedung/kos, tingkat okupansi visual, jumlah unit terisi/total, dan tautan drill-down langsung.
- [x] **Unified Multi-Domain Operational Activity Stream**: Feed kronologis aktivitas menggabungkan pembayaran lunas, sewa aktif baru, dan keluhan perbaikan terbaru dalam satu linimasa terpadu dengan avatar dan status badge semantik.
- [x] **Action Center Deep-Link Synchronization**: Seluruh aksi darurat di Action Center terhubung dengan filter presisi (`/kamar?status=kosong`, `/kontrak?filter=expiring`, `/pemeliharaan?status=menunggu`, `/keuangan?tab=invoices&filter=overdue`).
- [x] **Room Status Filter Parity**: Penyediaan filter pil status unit kamar (`Semua`, `Terisi`, `Kosong`, `Tunggakan`) di `/dashboard/owner/kamar` dengan sinkronisasi otomatis dari query params URL.

---

### Batch 12 — Property Detail Architecture & Multi-Domain Tabs (P1 — Selesai)
- [x] **5 Operational Tabs Architecture**: Implementasi 5 tab operasional di `/dashboard/owner/properti/[id]` (`Daftar Unit`, `Penyewa Aktif`, `Keuangan & Pendapatan`, `Pemeliharaan`, `Spesifikasi & Fasilitas`).
- [x] **Unit Search, Filter & CSV Export**: Pencarian unit kamar real-time, filter status unit, tombol tambah/edit unit kamar, dan ekspor CSV daftar kamar per properti.
- [x] **Property Tenant Roster**: Tampilan daftar penghuni aktif per properti dengan nomor kamar, tarif sewa, tanggal masuk, dan tautan WhatsApp langsung.
- [x] **Property Financial Breakdown**: Analisis potensi sewa bulanan, realisasi penerimaan kas, estimasi kerugian kamar kosong (vacancy loss), dan riwayat transaksi sewa per properti.
- [x] **Cross-Room Maintenance Tickets**: Rekap tiket pemeliharaan di seluruh unit kamar properti dengan status badge semantik dan indikator prioritas penanganan.
- [x] **Direct Operational Detail Access**: Tautan tombol "Detail Operasional" pada bilah pemilih properti di `/dashboard/owner/properti` untuk melompat langsung ke halaman detail 5-tab.

---

### Batch 13 — Tenant Management UX & 360° Profile Operational Command (P1 — Selesai)
- [x] **Tenant Operational KPI Summary**: 4 kartu ringkasan interaktif di `/dashboard/owner/penghuni` (`Total Penyewa`, `Aktif Menghuni`, `Belum Ditempatkan`, `Menunggak Tagihan` lengkap dengan total nominal rupiah tunggakan).
- [x] **Filter Pills Hierarchy**: Navigasi filter status satu klik (`Semua`, `Menghuni`, `Belum Ditempatkan`, `Menunggak`, `Nonaktif`) yang terintegrasi dengan pencarian teks.
- [x] **Tenant 360° Profile Drawer / Modal**: Modal ringkasan lengkap data penyewa menampilkan identitas, KTP, kontak WhatsApp, nomor unit kamar, rincian tagihan terbuka & jatuh tempo, riwayat tiket pemeliharaan, serta catatan khusus pengelola.
- [x] **Pindah Kamar (Room Move Flow)**: Alur pemindahan kamar atau pelepasan kamar penyewa secara transaksional dengan pilihan kamar kosong aktif dan pembaruan otomatis status kamar (`terisi` / `kosong`).
- [x] **Quick Action Toolbar**: Aksi cepat 1-tap WhatsApp dengan pesan otomatis, pintasan pembuatan tagihan baru, pencatatan pembayaran, dan pemindahan kamar.
- [x] **Rich Table & Full CSV Export**: Tabel penyewa menampilkan avatar inisial, badge status sewa, status lunas vs nominal tunggakan merah, serta ekspor CSV lengkap mencakup nomor KTP dan sisa tunggakan.

---

### Batch 14 — Lease UX, 4-Step Wizard & Renewal Flow (P1 — Selesai)
- [x] **Status & Property Filter Hierarchy**: Filter status komprehensif (`Semua`, `Aktif`, `Segera Berakhir`, `Diperpanjang`, `Selesai / Berhenti`) serta filter properti dropdown dan pencarian multi-parameter.
- [x] **Expiring Soon Visibility & Alert Banner**: Banner peringatan interaktif untuk kontrak yang berakhir dalam waktu kurang dari 30 hari beserta badge hitung mundur hari (`Sisa X hari lagi`).
- [x] **4-Step Structured Lease Creation Wizard**: Alur pembuatan kontrak sewa dibagi menjadi 4 tahap teratur (*Unit & Penyewa*, *Periode Sewa*, *Tarif & Jaminan*, *Pratinjau Aktivasi*) dengan inline validation dan tombol durasi cepat (1, 3, 6, 12 bulan).
- [x] **Conflicting Active Lease Prevention**: Pencegahan tabrakan sewa unit kamar baik melalui peringatan real-time di UI maupun validasi backend transaksi di `createLease`.
- [x] **Lease Renewal Flow (Perpanjangan Sewa)**: Fasilitas perpanjangan kontrak sewa resmi (`renewLease`) yang menandai kontrak lama sebagai `renewed`, menerbitkan nomor perpanjangan baru, menyesuaikan tarif sewa, dan memperbarui tanggal keluar penyewa secara transaksional.
- [x] **Lease Detail & Timeline Modal**: Tampilan linimasa kontrak (Mulai Sewa → Masa Berjalan → Akhir Masa Sewa), ketentuan finansial sewa & deposit, kontak WhatsApp 1-klik, dan tombol aksi perpanjangan / pengakhiran sewa.
- [x] **Destructive Terminate Confirmation**: Dialog konfirmasi pengakhiran sewa yang secara transaksional melepaskan penyewa dan mengembalikan unit kamar berstatus **Kosong**.

---

### Batch 15 — Financial UX: Invoice Management (P1 — Selesai)
- [x] **Comprehensive Invoice Search & Clear**: Pencarian real-time multi-dimensi mencakup nomor invoice, nama penyewa, nomor WhatsApp, nomor kamar, dan nama properti dengan tombol reset kilat (clear).
- [x] **Full Status Filters with Quantitative Counters**: Filter pil status lengkap (`Semua`, `Tertunggak`, `Belum Lunas`, `Sebagian`, `Lunas`, `Draf`, `Dibatalkan`) yang dilengkapi badge penghitung jumlah tagihan pada tiap status.
- [x] **Property & Date Range Presets**: Filter dropdown pemilihan properti spesifik dan rentang waktu tagihan (`Semua Tanggal`, `Bulan Ini`, `Bulan Lalu`, `Tahun Ini`, `Rentang Kustom`).
- [x] **Outstanding & Collection Action Center KPI**: 4 kartu ringkasan keuangan (`Total Tertunggak`, `Sisa Tagihan Aktif / Total Outstanding`, `Ditagihkan Periode Ini`, `Terkumpul Bulan Ini & Persentase Pelunasan Progress Bar`).
- [x] **Bulk WhatsApp Overdue Reminder (`Pengingat Masal WhatsApp`)**: Dialog rekap tagihan tertunggak untuk seluruh penyewa yang melewati tanggal jatuh tempo dengan tombol kirim pesan WhatsApp personal 1-klik dan tombol salin rekap broadcast ke clipboard.
- [x] **Manual Invoice Creation Dialog (`Terbitkan Tagihan Baru`)**: Formulir pembuatan tagihan fleksibel (sewa ad-hoc, denda keterlambatan, listrik, air, dsb) dengan baris biaya dinamis (tambah/hapus baris) dan kalkulasi total otomatis.
- [x] **360° Invoice Detail Modal**: Pratinjau komprehensif tagihan mencakup data penyewa (kontak WhatsApp langsung & email), nomor unit & kontrak sewa, linimasa penerbitan & jatuh tempo, indikator hari keterlambatan (`Terlambat X hari`), bar kemajuan pembayaran sebagian (`Terbayar X%`), rincian komponen biaya sewa, serta riwayat alokasi pembayaran.
- [x] **Guarded Invoice Cancellation Flow (`Batalkan Tagihan`)**: Konfirmasi pembatalan tagihan destruktif yang dilindungi invariant akuntansi (hanya dapat dibatalkan jika belum ada pembayaran teralokasi), mereset sisa tagihan menjadi Rp 0, mencatat alasan pembatalan, dan membukukan audit log.
- [x] **Printable Invoice & Payment Receipt Modal (`Cetak Kwitansi`)**: Pratinjau kwitansi resmi cetak ramah printer (`window.print()`) lengkap dengan kop properti, rincian biaya, riwayat pembayaran, dan kolom tanda tangan pengelola & penyewa.

---

### Batch 16 — Financial UX: Payment & Reconciliation (P1 — Selesai)
- [x] **Dedicated Payment & Reconciliation Tab**: Tab independen di `/dashboard/owner/keuangan` (`Pembayaran & Rekonsiliasi`) dilengkapi badge indikator pembayaran yang memiliki sisa kredit / overpayment belum teralokasi.
- [x] **Financial KPI Action Center**: 4 kartu ringkasan arus pembayaran (`Total Penerimaan`, `Teralokasi ke Tagihan`, `Sisa Kredit / Overpayment` dengan jumlah pembayaran berlebih, dan `Total Direfund` beserta jumlah kasus).
- [x] **Payment Amount, Allocated & Unallocated Split**: Tampilan visual yang membedakan secara tegas total nominal uang masuk, jumlah yang telah menyelesaikan faktur, dan sisa saldo kredit yang tersimpan.
- [x] **One-Payment to Multi-Invoice Interactive Settlement**: Modal pencatatan penerimaan pembayaran fleksibel dengan deteksi otomatis tagihan terbuka penyewa, mode alokasi FIFO (tertua dulu) atau Split Kustom manual per faktur, serta perlindungan duplikasi submit (*spinner guard*).
- [x] **Credit & Overpayment Reconciliation Flow**: Alur rekonsiliasi sisa kredit penyewa (`Alokasikan Sisa Kredit`) yang dapat dialokasikan sewaktu-waktu ke tagihan terbuka berikutnya dengan kalkulasi balance real-time.
- [x] **Guarded Refund & Reversal Flow**: Konfirmasi pembatalan/refund pembayaran yang memulihkan saldo terutang tagihan secara transaksional (`balanceDue` kembali, status disesuaikan ke `overdue`/`issued`/`partial`), mencatat mutasi pengeluaran penyeimbang di buku kas, dan mewajibkan pengisian alasan refund.
- [x] **360° Payment Detail & Financial Audit Trail**: Modal detail transaksi lengkap dengan rincian penyewa, kartu komposisi keuangan, tabel faktur teralokasi, serta linimasa jejak audit log (`payment.recorded`, `payment.reconciled`, `payment.refunded`).
- [x] **Printable Official Payment Receipt**: Dokumen kwitansi bukti penerimaan pembayaran ramah cetak (`window.print()`) lengkap dengan kop resmi Kontrakin, alokasi faktur, dan blok tanda tangan penyewa & pengelola.

---

### Batch 17 — Expense Management UX & Operational Cost Intelligence (P2 — Selesai)
- [x] **Dedicated Expense & Cashbook Tab**: Tab baru terdedikasi `Pengeluaran & Buku Kas` di `/dashboard/owner/keuangan` dengan sub-filter cepat (`Pengeluaran Operasional`, `Semua Arus Kas`, `Pemasukan Saja`).
- [x] **Financial KPI Action Center**: 4 kartu ringkasan biaya operasional (`Pengeluaran Bulan Ini`, `Biaya Pemeliharaan & Tiket`, `Biaya Utilitas & Operasional`, dan indikator anomali `Unit Beban Tertinggi / Room Leak Detection` lengkap dengan persentase beban biaya terhadap harga sewa).
- [x] **Standardized Rental Expense Categories**: 13 kategori standar operasional sewa Indonesia (`Utilitas: Listrik & PLN`, `Utilitas: Air & PDAM`, `Utilitas: Internet & Wifi`, `Operasional: Gaji & Upah Staf`, `Operasional: Kebersihan & Sampah`, `Pemeliharaan: AC & Pendingin`, `Pemeliharaan: Plumbing & Pompa Air`, `Pemeliharaan: Kelistrikan`, `Pemeliharaan: Bangunan & Sipil`, `Pajak & Legal: PBB & Izin`, `Pemasaran & Iklan`, `Perlengkapan & Logistik`, `Lain-lain`).
- [x] **Deep Multi-Dimensional Filters**: Filter berdasarkan kategori biaya, nama properti induk, nomor unit kamar spesifik, nama vendor/kontraktor, dan rentang tanggal (`Bulan Ini`, `Bulan Lalu`, `Tahun Ini`, `Semua Waktu`).
- [x] **Receipt Preview Modal**: Pratinjau langsung nota, faktur, struk pembelian, atau foto bukti pengeluaran dengan tombol buka ukuran penuh dan tautan dokumen eksternal.
- [x] **360° Expense Detail Modal**: Tampilan terperinci pengeluaran menampilkan besaran nominal rupiah, tanggal pencatatan, atribusi properti & nomor unit kamar, atribusi vendor pelaksana, tiket pemeliharaan tertaut (`#TIK`), deskripsi bersih, dan tombol cetak bukti pengeluaran operasional.
- [x] **Interactive Expense Creation & Maintenance Linking**: Formulir pencatatan pengeluaran baru dengan pemilihan tiket pemeliharaan aktif yang secara otomatis mengisi data unit kamar, properti, vendor, dan kategori biaya terkait.
- [x] **Expense Export UX**: Fasilitas ekspor CSV operasional komprehensif (`daftar_pengeluaran_operasional.csv`) yang mencakup metadata vendor, tiket pemeliharaan, tautan bukti bayar, dan atribusi kamar.

---

### Batch 18 — Maintenance Operations UX, SLA Dispatcher & Work Orders (P1 — Selesai)
- [x] **Pusat Operasional Pemeliharaan & SLA Action Center**: 4 kartu ringkasan interaktif di `/dashboard/owner/pemeliharaan` (`Menunggu Tindakan / Review`, `Sedang Diproses / Dikerjakan`, `SLA Terlewat (Breached)` dengan status kedip merah eskalasi, dan `Selesai & Ditutup`).
- [x] **Real-time SLA Calculation Engine**: Kalkulasi ketepatan waktu dinamis berdasarkan prioritas standar operasional sewa (`Tinggi: 24 Jam`, `Sedang: 48 Jam`, `Rendah: 5 Hari`) dengan badge status otomatis (*Sesuai SLA*, *Mendekati Tenggat <25%*, *SLA Terlewat +X jam/hari*, *Selesai Tepat Waktu*, *Selesai Lewat SLA*).
- [x] **Deep Multi-Dimensional Filters**: Filter real-time multi-dimensi mencakup teks pencarian fleksibel, pil status kuantitatif dengan badge counter, dropdown Properti, dropdown Kamar Unit, dropdown Vendor/Teknisi rekanan, dropdown Prioritas, dan filter khusus status SLA.
- [x] **360° Maintenance Detail Modal**: Modal komprehensif penanganan tiket menampilkan kode `#TIK`, lokasi kamar & properti, data pelapor/penyewa lengkap dengan tombol WhatsApp 1-tap otomatis, deskripsi kerusakan, pratinjau thumbnail foto keluhan & modal pembesar foto, linimasa visual 3 langkah pengerjaan, estimasi biaya, dan penugasan vendor teknisi.
- [x] **Interactive Operational Lifecycle Actions**: Alur transisi status yang jelas:
  - Dari `menunggu` → Aksi penugasan vendor atau mulai pengerjaan langsung (`diproses`).
  - Dari `diproses` → Aksi penyelesaian dengan pencatatan nominal biaya aktual perbaikan & opsi pembukuan otomatis ke Buku Kas Pengeluaran.
  - Dari `selesai` → Aksi buka kembali tiket (`reopen`) jika keluhan berulang dengan kewajiban mengisi catatan investigasi.
- [x] **Manual Ticket Creation Flow (`+ Buat Laporan Tiket`)**: Formulir pembuatan tiket keluhan baru oleh pemilik/staf dengan dropdown properti & kamar bertingkat (cascading), penentuan penyewa otomatis, estimasi biaya, penugasan teknisi/PIC staf, dan lampiran foto.
- [x] **Printable Official SPK Work Order (`Surat Perintah Kerja`)**: Format cetak dokumen resmi Surat Perintah Kerja teknisi ramah printer (`window.print()`) lengkap dengan nomor SPK, spesifikasi unit, instruksi kerusakan, dan kolom tanda tangan Teknisi serta Manajemen Pengelola.

---

### Batch 19 — Vendor UX & Rekanan Directory Management (P1 — Selesai)
- [x] **Dedicated Vendor Directory & Command Tab**: Tab terintegrasi `Direktori Rekanan Vendor` pada `/dashboard/owner/pemeliharaan` lengkap dengan indikator kuantitatif jumlah vendor aktif.
- [x] **Vendor Action Center KPI Cards**: 4 kartu ringkasan rekanan (`Total Rekanan Vendor`, `Sedang Bertugas` lengkap dengan jumlah tiket aktif yang ditangani, `Pekerjaan Selesai` kumulatif perbaikan, dan `Total Biaya Jasa Dibayarkan` yang tersinkronisasi dari buku kas).
- [x] **Multi-Dimensional Vendor Directory Search & Filters**: Pencarian multi-parameter (nama vendor, nomor telepon/WhatsApp, alamat bengkel, catatan tarif), filter spesialisasi (`Teknisi AC`, `Plumbing & Pompa`, `Kelistrikan`, `Tukang Bangunan`, `Tukang Kunci`, `Cleaning Service`, `General`), dan pengurutan fleksibel (*Tiket Terbanyak*, *Biaya Jasa Tertinggi*, *Rating Tertinggi*, *Nama A-Z*).
- [x] **Responsive Vendor Cards with Fast Contact Actions**: Kartu direktori rekanan menampilkan avatar inisial & spesialisasi, bintang rating kualitas (1-5★), nomor kontak, catatan tarif standar, pil rekap kinerja (*X Selesai • Y Aktif*), tombol 1-tap WhatsApp dengan pesan otomatis, tombol panggilan telepon langsung, tombol edit profil, dan tombol hapus aman.
- [x] **360° Vendor Profile Modal**: Modal performa rekanan komprehensif menampilkan:
  - Header profil lengkap dengan nama, spesialisasi, rating kualitas, dan kontak langsung.
  - Ringkasan KPI: *Total Tiket Ditangani*, *Pekerjaan Selesai*, *Tingkat Keberhasilan (Completion Rate %)*, dan *Kumulatif Biaya Jasa*.
  - **Sub-Tab Riwayat Pekerjaan (Work History)**: Linimasa seluruh tiket yang pernah ditangani vendor lengkap dengan kode `#TIK`, judul masalah, unit kamar & properti, data penyewa, dan status pengerjaan.
  - **Sub-Tab Riwayat Pengeluaran Kas (Expense History)**: Rincian seluruh pembayaran jasa kas yang dibukukan untuk vendor ini lengkap dengan tanggal, nominal rupiah, uraian perbaikan, dan unit kamar yang dibebankan.
  - Tombol cetak profil dan riwayat kinerja vendor resmi (`window.print()`).
- [x] **Safe Vendor Lifecycle & Deletion Guard**: Dialog konfirmasi penghapusan vendor yang dilindungi validasi integritas data (mencegah penghapusan vendor yang masih memiliki tiket perbaikan aktif yang belum selesai).
- [x] **Vendor CSV Export UX**: Fasilitas ekspor CSV direktori rekanan (`direktori_rekanan_vendor.csv`) mencakup spesialisasi, kontak, rating, jumlah tiket, dan total biaya jasa.

---

### Batch 20 — Communication & WhatsApp UX (P1 — Selesai)
- [x] **Pusat Komunikasi Action Center**: Tab terstruktur 3 bagian (`Kirim Pesan & Template WhatsApp`, `Riwayat Outbound (Audit Trail)`, `Linimasa Penyewa (Tenant Timeline)`).
- [x] **Communication Action Center KPI Cards**: 4 kartu metrik operasional (*Total Pesan*, *Tersampaikan / Delivered*, *Gagal Kirim / Failed*, *Penyewa Siap Dihubungi*).
- [x] **Interactive WhatsApp Template Selection**: Kategori pesan operasional (*H-5 Tagihan*, *H-1 Tagihan*, *Hari H Jatuh Tempo*, *Peringatan Tertunggak*, *Kwitansi Pelunasan*, *Pengumuman Properti*).
- [x] **Clickable Dynamic Variable Chips**: Chip variabel sekali klik (`{{nama_penyewa}}`, `{{nomor_kamar}}`, `{{total_tagihan}}`, `{{jatuh_tempo}}`, dll.) yang menyisipkan variabel dinamis langsung ke posisi kursor pesan.
- [x] **Live Phone Mockup Simulation**: Pratinjau langsung tampilan pesan WhatsApp di smartphone penerima dengan pemformatan bold (`*teks*`) dan centang status pengiriman (`✓✓`).
- [x] **Outbound Audit Trail & Failed Retry Action**: Tabel audit trail riwayat pesan lengkap dengan status pengiriman (*delivered*, *sent*, *failed*, *pending*), waktu kirim, ID log, tombol 1-tap `Kirim Ulang / Retry` untuk pesan gagal, dan tautan fallback WhatsApp instan.
- [x] **Chronological Tenant Timeline**: Linimasa kronologis seluruh riwayat notifikasi yang pernah diterima penyewa tertentu sebelum pengelola mengirimkan teguran baru.
- [x] **Outbound Communication CSV Export**: Fasilitas unduh arsip CSV log komunikasi (`riwayat_komunikasi_outbound.csv`).

---

### Batch 21 — Tenant Portal Mobile-First & Self-Service Experience (P1 — Selesai)
- [x] **Persistent Mobile Bottom Navigation (`TenantBottomNav`)**: Bilah navigasi bawah tetap di perangkat mobile (`sm:hidden fixed bottom-0`) dengan 5 tab operasional jempol (*Beranda*, *Tagihan*, *Keluhan*, *Kontrak*, *Profil*) lengkap dengan penanda rute aktif dan area sentuh 48px.
- [x] **Home Hierarchy & Active Unit Hero**: Banner unit kamar yang ditempati (*Kamar*, *Tipe*, *Properti*, *Alamat*, *Tarif Sewa*), status tagihan prioritas, 4 tombol navigasi cepat, ringkasan masa sewa, dan tombol 1-tap WhatsApp Pengelola.
- [x] **No-Outstanding-Payment Celebration State**: Tampilan apresiasi pelunasan dengan kartu hijau emerald (*Semua Tagihan Lunas!*) saat penyewa tertib membayar.
- [x] **Instant Payment Success Banner & Kwitansi Flow**: Alert notifikasi pelunasan sukses saat dialihkan dari halaman pembayaran (`?success=true`) dengan tombol langsung membuka kwitansi resmi.
- [x] **Official Printable Digital Kwitansi (`TenantReceiptModal`)**: Modal kwitansi pelunasan resmi ramah cetak (`window.print()`) lengkap dengan stempel digital `LUNAS / VERIFIED SYSTEM`, nomor kwitansi `KWT/{invoiceNumber}`, rincian komponen biaya sewa, metode pembayaran, referensi transaksi, dan catatan validasi buku kas.
- [x] **Maintenance Creation & 3-Step Lifecycle Status Timeline**:
  - Formulir keluhan responsif dengan ikon kategori (*Listrik*, *Air*, *Bangunan*, *Fasilitas*), panduan tingkat urgensi (*Rendah*, *Sedang*, *Tinggi/Mendesak*), dan tombol darurat WhatsApp.
  - Visual timeline progres tiket: `1. Diterima Sistem` ➔ `2. Sedang Dikerjakan Teknisi` ➔ `3. Selesai Diperbaiki`.
- [x] **Official Printable Lease Document (`Surat Perjanjian Sewa Kamar`)**: Modal dokumen hukum perjanjian sewa unit dengan format resmi Indonesia (Pasal 1 Objek Sewa, Pasal 2 Jangka Waktu & Tarif, Pasal 3 Deposit Jaminan, Pasal 4 Kewajiban & Tata Tertib, Pasal 5 Larangan) lengkap dengan kolom tanda tangan digital dan tombol cetak PDF.
- [x] **Authentic Tenant Profile & Account Settings**: Halaman profil nyata terhubung database (bukan data dummy), formulir pembaruan nama & nomor WhatsApp, penempatan kamar aktif, panduan FAQ sewa, dan pengubah kata sandi mandiri via enkripsi Better Auth.

---

### Batch 22 — Superadmin Platform Console & Governance (P1 — Selesai)
- [x] **8 Core Action Center Platform KPIs**:
  - *Organisasi Customer*: Total akun entitas bisnis rental.
  - *Langganan Berbayar*: Akun berstatus aktif (Paid).
  - *Masa Uji Coba*: Akun trial 14 hari masa evaluasi.
  - *Estimasi MRR*: Monthly Recurring Revenue real-time terhitung dari paket pelanggan aktif.
  - *Kamar/Unit Terkelola*: Total portofolio unit & jumlah terisi aktif.
  - *Total Pengguna SaaS*: Distribusi pengguna (*Owner*, *Staff*, *Tenant*).
  - *Perlu Atensi Billing*: Deteksi organisasi dengan status *past due*.
  - *Kesehatan Platform*: Metrik ketersediaan 100% online & pemantauan antrean tugas.
- [x] **Customer Organization Directory & Multi-Status Filtering**:
  - Pencarian multi-parameter (nama organisasi, slug `@org`, nama pemilik, email owner).
  - Filter status langganan (*Semua*, *Aktif*, *Trial*, *Past Due*).
  - Progress bar penggunaan kuota unit (*X / Y Unit terpakai*).
- [x] **360° Organization Detail Modal with Safe Support Access**:
  - Ringkasan paket, harga/bln, kuota unit & properti, tanggal registrasi.
  - Daftar anggota tim & staf terdaftar beserta perannya di organisasi.
  - **Safe Technical Support Mode**: Banner read-only terverifikasi untuk diagnosis kendala teknis customer tanpa hak mutasi sewenang-wenang.
  - Tautan WhatsApp langsung ke Owner untuk koordinasi bantuan kilat.
- [x] **SaaS Plans & Feature Limits Matrix Tab**:
  - Matriks perbandingan tier *Starter* (Rp 99rb/bln, 10 unit), *Professional* (Rp 299rb/bln, 50 unit), dan *Business Scale* (Rp 699rb/bln, 200 unit).
  - Rekap kuantitatif jumlah pelanggan aktif per tier.
- [x] **System Health Cluster & Failed Jobs Queue**:
  - Status operasional Database PostgreSQL (latency ms), Background Queue (workers), Private Storage, dan WhatsApp Gateway.
  - Pemantauan tugas background gagal (webhook mismatch, gateway timeout) lengkap dengan tombol 1-tap `Retry Job`.
- [x] **Global Audit Log Stream**:
  - Pencarian log mutasi sensitif di seluruh sistem berdasarkan aksi, entitas, pelaku, dan organisasi.
- [x] **Organization Directory CSV Export**:
  - Ekspor CSV komprehensif data organisasi pelanggan platform (`platform_organisasi_kontrakin_*.csv`).

---

### Batch 23 — Team & Permission UX (P1 — Selesai)
- [x] **4 Core Action Center Team KPIs**:
  - *Total Tim Aktif*: Jumlah seluruh anggota staf dan pemilik yang terdaftar dalam organisasi.
  - *Pemilik Utama / Owner*: Jumlah akun pemilik dengan hak akses penuh atas bisnis properti.
  - *Manajer & Admin*: Pengelola operasional harian yang dapat mengatur unit, sewa, dan pengeluaran.
  - *Keuangan & Lapangan*: Spesialis buku kas (*finance*) dan teknisi lapangan (*staff* pemeliharaan).
- [x] **Team Member Directory & Dynamic Role Filtering**:
  - Filter cepat berdasarkan peran (*Semua*, *Owner*, *Admin*, *Manager*, *Finance*, *Staff*).
  - Pencarian anggota berdasarkan nama atau alamat email.
  - Tanda visual khusus gembok `Pemilik Utama (Terkunci)` untuk akun owner aktif guna mencegah mutasi yang tidak diinginkan.
- [x] **Role Editor Dialog with Real-Time Mutation**:
  - Dialog pemilihan peran staf dengan penjelasan detail hak akses masing-masing level.
  - Validasi ketat proteksi sole-owner: sistem secara otomatis melarang demosi owner terakhir ke peran staf.
- [x] **Safe Destructive Member Removal with Confirmation Dialog**:
  - Dialog konfirmasi Radix UI yang aman (menggantikan `window.confirm`) untuk mencegah klik tidak sengaja.
  - Invarian lockout protection: mencegah penghapusan akun owner terakhir dan self-deletion akun pemilik yang sedang login.
- [x] **Interactive RBAC Feature & Matrix Guide Tab**:
  - Matriks perbandingan hak akses komprehensif untuk 6 peran di seluruh modul sistem (*Properti & Unit*, *Penyewa & Kontrak*, *Penagihan & Invoice*, *Buku Kas & Pengeluaran*, *Tiket Perbaikan*, *Manajemen Tim*).
  - Banner jaminan keamanan backend: mengklarifikasi bahwa setiap aksi divalidasi ketat di sisi server via [lib/auth/permissions.ts](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/lib/auth/permissions.ts) dan tidak semata-mata mengandalkan penyembunyian antarmuka (UI hiding).
- [x] **Unit Testing & Verification**:
  - 16/16 unit test passing di [tests/finance-and-audit.test.mjs](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/tests/finance-and-audit.test.mjs) mencakup evaluasi permission RBAC, pencegahan demosi sole-owner, dan proteksi self-deletion.
---

### Batch 24 — Onboarding & First-Run Experience (P1 — Selesai)
- [x] **Full 5-Step Operational Onboarding Target**:
  - `Signup` ➔ `Organization` ➔ `Property` ➔ `Units` ➔ `Tenant` ➔ `Lease` ➔ `First Invoice`.
  - Integrasi komponen interaktif [OnboardingWizard.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/components/dashboard/OnboardingWizard.tsx) di [app/dashboard/owner/page.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/page.tsx).
- [x] **5 Guided Steps Checklist & Progress Indication**:
  - *Langkah 1*: Daftarkan Properti (`propertiCount > 0`).
  - *Langkah 2*: Tambah Unit Kamar (`totalKamar > 0`).
  - *Langkah 3*: Daftarkan Penyewa (`penghuniCount > 0`).
  - *Langkah 4*: Aktifkan Kontrak Sewa (`kamarTerisi > 0 || activeLeases > 0`).
  - *Langkah 5*: Terbitkan Tagihan Perdana (`totalInvoicesCount > 0`).
  - Real-time percentage indicator (`X dari 5 Selesai (XX%)`) dan progress bar animasi transisi halus.
- [x] **Contextual Help Modal & Collapsible Wizard**:
  - Tombol bantuan ikon tanda tanya di setiap kartu langkah yang membuka modal dialog penjelasan detail, estimasi waktu penyelesaian (1-2 menit), serta manfaat otomatisasi bagi bisnis properti.
  - Kemampuan collapse/expand bilah checklist onboarding agar pengguna fleksibel memprioritaskan pandangan triase dashboard.
- [x] **Empty States Terhubung ke Onboarding**:
  - **Halaman Properti** ([properti-kamar-client.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/properti/properti-kamar-client.tsx)): Menampilkan badge `Langkah 1 dari 5 Setup Portofolio`, deskripsi edukatif, tombol tambah properti pertama, dan tautan kembali ke Panduan Setup.
  - **Halaman Kamar** ([kamar-client.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/kamar/kamar-client.tsx)): Menampilkan badge `Langkah 2 dari 5 Setup Portofolio`, tombol tambah kamar perdana, dan navigasi ke Panduan Setup.
  - **Halaman Penyewa** ([penghuni-client.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/penghuni/penghuni-client.tsx)): Menampilkan badge `Langkah 3 dari 5 Setup Portofolio`, penjelasan alur sewa, dan tombol navigasi panduan setup.
  - **Halaman Kontrak Sewa** ([kontrak-client.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/kontrak/kontrak-client.tsx)): Menampilkan badge `Langkah 4 dari 5 Setup Portofolio`, penjelasan fungsi dokumen resmi, dan aksi buat kontrak perdana.
  - **Halaman Tagihan & Keuangan** ([keuangan-client.tsx](file:///c:/Users/Erin%20Fitriani/OneDrive/Desktop/Kontrakin/kontrakin/app/dashboard/owner/keuangan/keuangan-client.tsx)): Menampilkan badge `Langkah 5 dari 5 Setup Portofolio` pada tabel invoice kosong, tombol generate tagihan sewa otomatis, dan tautan panduan setup.
- [x] **Verification & Unit Tests**:
  - `npx tsc --noEmit`: 0 error.
  - `node --test tests/finance-and-audit.test.mjs`: **17/17 passing tests** mencakup perhitungan progress onboarding, deteksi status incomplete, evaluasi langkah 1-5, dan pengujian empty state integratif.

---

### Batch 25 — Import / Migration UX (P1 — Selesai)
- [x] **Multi-Format Upload (CSV/TSV/TXT) & Template Download**:
  - Dukungan drag-and-drop berkas (.csv, .tsv, .txt) serta tab alternatif untuk penempelan teks langsung dari clipboard.
  - Tombol 1-klik unduh template standar CSV (`template_impor_penghuni.csv`) dengan contoh format yang kompatibel langsung dengan Microsoft Excel, Google Sheets, dan Apple Numbers.
  - Empty state halaman penyewa (`penghuni-client.tsx`) dilengkapi tombol langsung *Impor Excel / CSV* sesuai standar AGENTS.md Section 23.
- [x] **Smart Column Mapping Heuristics**:
  - Deteksi otomatis header kolom file input (Nama Lengkap, Nomor HP/WhatsApp, Email, NIK/KTP, Tanggal Masuk, Catatan) dan dropdown pemetaan manual bila header tidak standar.
- [x] **Client-Side & Server-Side Batch Validation**:
  - Validasi keberadaan nama dan nomor WhatsApp/HP.
  - Normalisasi nomor handphone Indonesia (`normalizeIndonesianPhone`) memastikan rentang 9–15 digit.
- [x] **Internal Duplicate Collision & Organization Duplicate Protection**:
  - Deteksi dan pencegahan duplikasi nomor HP di dalam batch file itu sendiri.
  - Pengecekan real-time terhadap nomor HP penyewa yang sudah terdaftar dalam `organizationId` di basis data, mencegah penimpaan atau duplikasi akun penyewa secara tidak sengaja.
- [x] **Filterable Interactive Preview Table**:
  - Filter tabel pratinjau: *Semua*, *Siap Diimpor*, *Bermasalah*.
  - Menampilkan badge status validitas baris per baris beserta rincian alasan masalah dalam bahasa Indonesia.
- [x] **Batch Execution with Idempotency Protection**:
  - Proteksi double-submit: tombol eksekusi terkunci (`isSubmitting`) selama proses transaksi berlangsung.
  - Transaksi aman (`prisma.$transaction`) hanya memasukkan baris valid tanpa menggugurkan seluruh batch jika sebagian baris bermasalah.
- [x] **Structured Import Result & 1-Click Download Failed Rows**:
  - Ringkasan hasil impor: Total diproses, Berhasil diimpor, dan Dilewati/Gagal.
  - Tombol 1-klik **"Unduh Baris Gagal (CSV)"**: Mengunduh berkas CSV berisi baris-baris yang gagal lengkap dengan kolom *Alasan Gagal* agar pengguna dapat langsung memperbaikinya di Excel dan mengunggah kembali.
- [x] **Audit Log History**:
  - Setiap batch impor dicatat ke tabel `audit_log` dengan aksi `penghuni.batch_imported` lengkap dengan metadata (`totalRows`, `importedCount`, `failedCount`, `fileName`, actor).
  - Tampilan tab/drawer *Riwayat Impor* menampilkan 10 histori impor terakhir organisasi.
- [x] **Verification & Unit Tests**:
  - `npx tsc --noEmit`: 0 error.
  - `node --test tests/finance-and-audit.test.mjs`: **18/18 passing tests** mencakup parser CSV RFC-4180 dengan kutip/koma, resolusi heuristik pemetaan kolom, validasi batch, pencegahan duplikat database, dan struktur unduhan baris gagal.

---

### Batch 19 — Table Usability & Responsive Data Views (Selesai)
- [x] **DataTablePagination & Dynamic Page Sizing**:
  - Komponen paginasi terpadu dengan opsi ukuran halaman (10, 25, 50, 100 baris) dan navigasi halaman aktif.
- [x] **ColumnVisibilityToggle**:
  - Dropdown kontrol visibilitas kolom untuk tabel direktori penyewa, kamar, dan kontrak sewa.
- [x] **BulkActionBar**:
  - Bilah tindakan massal mengambang saat baris dipilih (ekspor pilihan, kirim pesan broadcast, dan uncheck all).
- [x] **Mobile Responsive Stacked Cards**:
  - Tabel beralih otomatis ke format kartu vertikal di viewport mobile (<640px) untuk menghindari scroll horizontal ekstrem.
- [x] **Verification & Unit Tests**:
  - `node --test tests/finance-and-audit.test.mjs`: **19/19 passing tests**.

---

### Batch 20 — Form UX Standardization (Selesai)
- [x] **Standardized Form Controls (`components/form/form-controls.tsx`)**:
  - `FormField` dengan dukungan label, deskripsi bantuan, dan pesan error semantik.
  - `CurrencyInput` otomatis memformat nominal Rupiah (`Rp 1.500.000`) dan mengembalikan nilai integer bersih.
  - `PhoneInput` otomatis memformat awalan nomor WhatsApp Indonesia (`+62`).
  - `FormSection` untuk pembagian kelompok kolom yang terstruktur rapi.
- [x] **SubmitButton with Duplicate Submit Prevention**:
  - Proteksi anti double-click dengan status `isPending` dan indikator spinner animasi.
- [x] **UnsavedChangesDialog & Dirty Form Tracking**:
  - Peringatan sebelum menutup formulir kamar, penyewa, atau pemeliharaan jika pengguna telah mengubah isian.
- [x] **Verification & Unit Tests**:
  - `node --test tests/finance-and-audit.test.mjs`: **20/20 passing tests**.

---

### Batch 21 — Modal, Drawer & Detail Interaction Rules (Selesai)
- [x] **Modal vs Drawer vs Page Architecture Rule**:
  - `Modal`: Untuk konfirmasi penting dan formulir berukuran ringkas (`UnsavedChangesDialog`, modal tambah data cepat).
  - `Drawer (Sheet)`: Untuk inspeksi kontekstual 360° (360° Profil Penyewa di `penghuni-client.tsx`, Linimasa & Rincian Kontrak di `kontrak-client.tsx`) agar pengguna tidak kehilangan konteks posisi tabel.
  - `Page`: Untuk alur kerja multi-langkah yang kompleks (rekonsiliasi kas, pelaporan).
- [x] **Standardized Destructive Confirmation (`DestructiveDialog`)**:
  - Komponen `components/ui/destructive-dialog.tsx` menggantikan dialog hapus ad-hoc di Penyewa, Kamar, Properti, dan Pengakhiran Kontrak.
  - Menampilkan nama entitas yang ditargetkan, peringatan permanen tegas, dan tombol hapus merah dengan proteksi double-submit `isPending`.
- [x] **Drawer Close Behavior & Mobile Responsiveness**:
  - Transisi slide-over sisi kanan dengan penutup eksplisit `X` dan tombol `Tutup Detail`.
  - Di layar mobile (<640px), drawer otomatis mengisi layar penuh (`w-full`) dengan scrollable container (`overflow-y-auto`) agar tidak terpotong.
- [x] **Verification & Unit Tests**:
  - `npx tsc --noEmit`: 0 error.
  - `node --test tests/finance-and-audit.test.mjs`: **21/21 passing tests**.

---

### Batch 22 — Empty, Loading, Error & Success States (Selesai)
- [x] **Skeleton Standards (`components/ui/skeleton-states.tsx`)**:
  - `TableSkeleton`: Layout skeleton responsif untuk tabel operasional (kolom & baris dinamis).
  - `CardGridSkeleton`: Layout grid skeleton untuk kartu KPI/metrik dan galeri unit.
  - `DetailDrawerSkeleton`: Loading state untuk drawer inspeksi 360° kontekstual.
- [x] **Error States & Retry Engine (`components/ui/error-state.tsx`)**:
  - `ErrorState`: Menampilkan deskripsi error operasional yang manusiawi, kode diagnostik/digest, tombol *Coba Lagi* dengan spinner `retrying`, dan navigasi fallback.
  - `NetworkErrorState`: Khusus menangani kegagalan jaringan internet dan server unreachable.
  - `PermissionDeniedState`: Memberikan feedback jelas terkait pembatasan peran (`requiredRole`) tanpa memutus navigasi pengguna.
- [x] **404 Not Found Page (`app/not-found.tsx`)**:
  - Tampilan 404 berstandar brand Kontrakin dengan kompas navigasi dan tombol pintas ke dashboard.
- [x] **Error Boundaries (`app/error.tsx` & `app/dashboard/error.tsx`)**:
  - Menangkap error tak terduga di tingkat dashboard maupun aplikasi global tanpa layar putih (blank screen), dilengkapi tombol `reset()` dan logging diagnostik.
- [x] **Consistent Toast Notifications & Non-Generic Errors (`lib/utils/toasts.ts`)**:
  - `notifySuccess`: Format pesan semantik Subject + Verb + Outcome ("Kamar 101 berhasil diperbarui").
  - `notifyFinancialSuccess`: Notifikasi khusus finansial menyertakan nominal Rupiah dan kode referensi.
  - `notifyError`: Menyaring dan memblokir pesan generik ("Something went wrong") menjadi instruksi perbaikan yang dapat ditindaklanjuti.
- [x] **Verification & Unit Tests**:
  - `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`: **0 error**.
  - `node --test tests/finance-and-audit.test.mjs`: **22/22 passing tests**.

---

### Batch 23 — Authentication Model Hardening & Removal of Public Tenant Registration (Selesai)
- [x] **Public Registration Simplification (`app/(auth)/register/page.tsx`)**:
  - Penghapusan selector peran pendaftaran publik (`tenant` vs `owner`).
  - Halaman registrasi difokuskan secara eksklusif untuk pendaftaran Pemilik Properti (Owner) dengan copy "Mulai kelola rental property Anda".
  - Banner informasi penyewa mengarahkan bahwa akses Tenant Portal diaktifkan langsung oleh pemilik properti via tautan aktivasi WhatsApp/email.
- [x] **Backend Registration Enforcement & Anti-Escalation (`lib/auth/server.ts` & `lib/auth/client.ts`)**:
  - Server-side hook `databaseHooks.user.create.before` secara tanpa syarat menetapkan `role: "owner"` dan `registrationRole: "owner"` pada setiap akun yang didaftarkan melalui jalur publik.
  - Parameter `registrationRole` diset `input: false` pada Better Auth untuk menolak injeksi peran client-side.
  - Pembuatan akun Tenant dilindungi melalui alur aktivasi Owner-governed (`TenantActivationService`).
- [x] **Deprecated Route Graceful Handling (`app/(auth)/register/tenant/page.tsx`)**:
  - Menyediakan halaman ramah pengguna untuk rute lama `/register/tenant` yang menjelaskan bahwa akses penghuni diterbitkan melalui undangan/aktivasi Owner, dilengkapi tombol masuk (`/login`) dan beranda (`/`).
- [x] **Branding & Auth Copy Normalization (`app/(auth)/login/page.tsx` & `components/layout/Header.tsx`)**:
  - Standarisasi nama brand **Kontrakin** dan pesan role-neutral pada halaman login.
- [x] **Verification & Dedicated Test Suite**:
  - Penambahan `tests/public-registration-policy.test.mjs` memverifikasi pencegahan eskalasi peran dan integritas pemisahan model provisioning.
  - Seluruh test suite: **62/62 passing tests** (`npm test`).
  - Typecheck: **0 error** (`tsc --noEmit`).




