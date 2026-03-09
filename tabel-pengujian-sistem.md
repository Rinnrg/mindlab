# Tabel Pengujian Sistem LMS

Dokumentasi ini berisi tabel pengujian lengkap untuk sistem Learning Management System (LMS) yang mencakup semua modul dan fitur utama.

## **Pengujian Fungsional**

| Modul / Fitur | Skenario Pengujian (Test Case) | Hasil yang Diharapkan |
|---------------|--------------------------------|------------------------|
| **Otentikasi dan Keamanan** | Login sebagai admin dengan kredensial yang benar | Sistem mengarahkan ke dashboard admin dengan akses penuh ke semua fitur |
| | Login sebagai guru dengan kredensial yang benar | Sistem mengarahkan ke dashboard guru. Menu admin tidak terlihat/tidak dapat diakses |
| | Login sebagai siswa dengan kredensial yang benar | Sistem mengarahkan ke dashboard siswa. Menu admin dan guru tidak terlihat/tidak dapat diakses |
| | Login dengan kredensial yang salah | Sistem menolak akses dan menampilkan pesan error "Email atau password salah" |
| | Akses halaman protected tanpa login | Middleware redirect otomatis ke halaman login |
| | Logout dari sistem | Session dihapus, redirect ke halaman login, tidak bisa akses halaman protected |
| **Kelola Kelas dan Enrollment (Admin)** | Admin menambah kelas baru dan memilih guru pengampu/pengajar | Sistem menyimpan kelas yang sudah ditambahkan, dan secara otomatis melakukan enrollment guru pada kelas tersebut |
| | Admin mengedit detail kelas dengan merubah nama atau kategori kelas dan menyimpannya | Sistem menyimpan perubahan yang dilakukan, perubahan terlihat di seluruh sistem |
| | Admin menghapus kelas | Sistem menghapus kelas yang dipilih, termasuk data enrollment yang ada, dengan konfirmasi hapus |
| | Admin membuka menu enrollment, memilih kelas tujuan, dan memilih siswa yang akan dimasukkan ke dalam kelas | Sistem menyimpan data enrollment, siswa yang sudah masuk ke kelas dapat melihat dan mengakses kelas |
| | Admin mengeluarkan siswa dari kelas | Data enrollment siswa dihapus, siswa tidak dapat mengakses kelas tersebut |
| **Kelola Pengguna (Admin)** | Admin menambahkan pengguna secara manual (satu persatu) | Sistem menyimpan data pengguna yang telah ditambahkan dengan role yang sesuai |
| | Admin menambahkan pengguna secara massal dengan mengupload file excel sesuai format yang telah ditentukan oleh sistem | Sistem memvalidasi format file, menyimpan data pengguna yang valid, dan memberikan report hasil upload |
| | Admin mengedit data pengguna dengan mengubah email atau password | Sistem menyimpan perubahan yang telah dilakukan, user bisa login dengan data baru |
| | Admin menghapus pengguna | Sistem menghapus data pengguna yang dipilih dengan konfirmasi, termasuk data terkait (enrollment, nilai, dll) |
| **Manajemen Course (Guru)** | Guru membuat course baru dengan detail lengkap | Course tersimpan di database, muncul di dashboard guru dan dapat diakses |
| | Guru mengedit informasi course (nama, deskripsi, kategori) | Perubahan tersimpan dan terlihat oleh semua user yang terdaftar di course |
| | Guru menghapus course | Course dan semua data terkait (materi, asesmen, forum) terhapus dengan konfirmasi |
| **Materi Pembelajaran** | Guru membuat materi baru, mengunggah file materi (PDF, PPT, Word) pada lampiran | File berhasil terunggah ke storage, link unduhan berfungsi, metadata tersimpan |
| | Guru mengedit materi yang sudah ada | Perubahan tersimpan, file lama diganti (jika ada upload baru), siswa melihat versi terbaru |
| | Siswa mengakses materi yang telah dibuat guru dan mengunduh file lampiran | Sistem menampilkan materi, file lampiran terunduh dengan benar dan dapat dibuka |
| | Siswa yang tidak terdaftar di course mencoba akses materi | Sistem menolak akses dengan pesan error atau redirect ke enrollment |
| **Asesmen/Quiz** | Guru membuat soal asesmen pilihan ganda dan menambahkan gambar pada beberapa soal | Sistem menyimpan soal dan gambar yang dibuat guru, menampilkan dengan benar di interface siswa |
| | Guru membuat asesmen essay dengan rubrik penilaian | Asesmen essay tersimpan dengan rubrik, guru dapat menilai jawaban siswa sesuai rubrik |
| | Siswa mengerjakan asesmen pilihan ganda dan menekan tombol submit | Sistem menghitung skor secara otomatis berdasarkan kunci jawaban dan menampilkan nilai akhir |
| | Siswa mengerjakan asesmen essay dan submit jawaban | Jawaban tersimpan, status "sudah dikerjakan" terupdate, menunggu penilaian guru |
| | Guru memberikan nilai pada asesmen essay siswa | Nilai tersimpan, siswa dapat melihat nilai dan feedback dari guru |
| | Ketika mengerjakan asesmen, siswa mencoba mengeluarkan pointer mouse keluar area asesmen | Sistem menampilkan peringatan bahwa siswa keluar dari halaman asesmen dan mencatat jumlah pelanggaran |
| | Siswa mencoba akses asesmen yang sudah lewat deadline | Sistem menolak akses dengan pesan "Asesmen sudah ditutup" |
| **Proyek PjBL** | Guru membuat tahap proyek baru (Input: judul, deskripsi, tenggat waktu) | Data proyek tersimpan di database dan muncul di halaman siswa dengan deadline yang jelas |
| | Guru membentuk kelompok baru dan menambahkan anggota | Kelompok terbentuk, nama anggota tercatat, siswa dapat melihat anggota kelompok mereka |
| | Siswa mengakses tahapan proyek, melihat instruksi, dan mengunduh file lampiran (jika ada) | Tahapan proyek dapat diakses, instruksi terbaca jelas, file lampiran terunduh dengan benar |
| | Siswa menambah, mengedit, dan menghapus pengumpulan proyek (1 pengumpulan 1 kelompok) dengan melampirkan tautan atau file dan deskripsi | Sistem menyimpan proyek (tautan/file), hanya 1 anggota kelompok yang bisa submit per kelompok |
| | Guru memberikan nilai pada proyek yang telah dikumpulkan | Sistem menyimpan nilai dan semua anggota kelompok dapat melihat nilai yang diberikan oleh guru |
| **Logbook** | Siswa mengisi form logbook (tanggal, aktivitas, kendala, file lampiran) dan menyimpannya | Data tersimpan dan langsung muncul di riwayat logbook siswa dengan timestamp yang benar |
| | Siswa mengedit entry logbook yang sudah dibuat | Perubahan tersimpan dengan marking "edited", history tetap terjaga |
| | Guru melihat logbook semua siswa di kelasnya | Guru dapat memonitor progress semua siswa dengan filter berdasarkan tanggal atau siswa |
| **Online Compiler** | Siswa menulis kode Java valid (contoh: `System.out.println("Test");`) dan menekan tombol run | Compiler memproses kode dan menampilkan output "Test" tanpa refresh halaman |
| | Siswa menulis kode dengan sintaks error (kurang titik koma `;`) | Sistem menampilkan pesan error yang jelas dengan line number yang bermasalah |
| | Siswa menulis kode yang infinite loop atau memakan memory berlebih | Sistem menghentikan eksekusi dengan timeout dan menampilkan pesan "Execution timeout" |
| **Forum Diskusi Asesmen** | Siswa yang sudah menyelesaikan asesmen membuat diskusi baru di forum | Diskusi tersimpan dan muncul di forum dengan badge "Siswa" |
| | Siswa yang belum menyelesaikan asesmen mencoba akses forum | Sistem menampilkan "Forum Terkunci" dengan pesan harus menyelesaikan asesmen dulu |
| | Guru membuat diskusi atau membalas di forum asesmen | Diskusi/balasan tersimpan dengan badge "Guru" yang menonjol dan authority tinggi |
| | Siswa membalas diskusi di forum | Balasan tersimpan dan muncul dengan badge "Siswa" |
| | Guru menghapus diskusi/balasan yang tidak pantas (moderasi) | Konten terhapus dari database dan UI, log moderasi tercatat |
| **Schedule/Jadwal** | Guru membuat jadwal kelas dengan waktu dan ruangan | Jadwal tersimpan dan muncul di kalender guru dan siswa yang terdaftar |
| | Admin membuat jadwal umum untuk seluruh sekolah | Jadwal muncul di dashboard semua user dengan marking "Jadwal Umum" |
| | Siswa melihat jadwal personal mereka | Sistem menampilkan only jadwal kelas yang diikuti siswa tersebut |
| **Dashboard & Statistics** | Admin melihat statistik pengguna dan aktivitas sistem | Dashboard menampilkan jumlah user aktif, course aktif, dan metrics engagement |
| | Guru melihat progress siswa di kelasnya | Dashboard guru menampilkan completion rate asesmen, partisipasi forum, submission proyek |
| | Siswa melihat progress pembelajaran mereka | Dashboard siswa menampilkan nilai, tugas pending, jadwal upcoming |

## **Pengujian Non-Fungsional**

| Modul / Fitur | Skenario Pengujian (Test Case) | Hasil yang Diharapkan |
|---------------|--------------------------------|------------------------|
| **Kinerja (Performance)** | Mengakses halaman utama LMS dan mengukur waktu muat (load time) | Halaman terbuka sempurna dalam waktu < 2 detik (optimized loading) |
| | Mengunggah file dengan ukuran besar (4-5MB) | Upload berhasil dengan progress indicator, file tersimpan dengan benar |
| | Mengunggah file dengan ukuran di atas batas (> 5MB) | Sistem menolak unggahan dan memberikan peringatan batas ukuran file |
| | Sistem diakses oleh 100+ user concurrent | Server menangani load dengan response time tetap acceptable (<3 detik) |
| | Load testing pada fitur compiler dengan multiple requests | Compiler service tetap responsif, queue system berfungsi untuk antrian |
| **Kompatibilitas** | Membuka LMS menggunakan browser Google Chrome dan Microsoft Edge | Tampilan (layout) tidak pecah dan semua fitur berjalan lancar di kedua browser |
| | Membuka LMS di browser Safari dan Firefox | Interface responsive, semua JavaScript functions bekerja dengan baik |
| | Akses LMS melalui mobile device (smartphone/tablet) | Layout responsive, touch interface user-friendly, semua fitur dapat diakses |
| | Test pada berbagai resolusi layar (1920x1080, 1366x768, mobile) | UI menyesuaikan dengan baik, tidak ada element yang terpotong |
| **Keamanan (Security)** | Mencoba mengakses halaman URL khusus admin (misal: `/admin/dashboard`) tanpa login sebagai guest | Sistem secara otomatis redirect paksa ke halaman login (middleware protection) |
| | Siswa mencoba mengakses URL admin dengan login sebagai siswa | Sistem menolak akses dengan HTTP 403 Forbidden |
| | Mencoba SQL injection pada form login dan input lainnya | Sistem menggunakan parameterized query (Prisma ORM), input tidak mempengaruhi database |
| | Mencoba XSS attack melalui input form (script tags, etc) | Input di-sanitize dan di-escape, script tidak ter-eksekusi di browser |
| | Test CSRF protection pada form submission | Token CSRF divalidasi, request tanpa token valid ditolak |
| | Mencoba access direct file upload URL | File hanya dapat diakses oleh user yang authorized, ada validasi token |
| **Ketersediaan (Availability)** | Mengakses LMS pada jam sibuk maupun jam malam | Server merespon dan sistem dapat diakses tanpa downtime signifikan |
| | Sistem berjalan continuous selama 24 jam | Tidak ada memory leak, performance tetap stabil |
| | Database connection pool test | Sistem menangani multiple DB connection dengan efficient connection pooling |
| **Usability** | User baru (guru/siswa) menggunakan sistem tanpa training | Interface intuitif, user dapat menyelesaikan task dasar tanpa kesulitan |
| | Navigation dan menu structure | Menu logical dan consistent, breadcrumb navigation jelas |
| | Error messages dan feedback | Pesan error user-friendly dan memberikan guidance yang jelas |
| **Data Integrity** | Backup dan restore data sistem | Data dapat di-backup dan di-restore tanpa corruption |
| | Concurrent editing pada data yang sama | System menangani race condition dengan proper locking mechanism |
| | Data validation pada semua input form | Invalid data ditolak dengan pesan error yang specific |

## **Pengujian Edge Cases**

| Modul / Fitur | Skenario Pengujian (Test Case) | Hasil yang Diharapkan |
|---------------|--------------------------------|------------------------|
| **Network Issues** | Koneksi internet terputus saat mengerjakan asesmen | Sistem menyimpan progress local, recovery ketika koneksi kembali |
| | Timeout saat upload file besar | Progress upload dapat di-resume, atau error handling yang graceful |
| | Slow network connection | Loading states dan progress indicators memberikan feedback yang baik |
| **Browser Issues** | JavaScript disabled di browser | Sistem menampilkan pesan bahwa JavaScript diperlukan untuk fungsionalitas penuh |
| | Cookie dan local storage disabled | Authentication tetap berfungsi dengan fallback mechanism |
| | Browser cache penuh atau corrupted | Sistem dapat handle cache issues dengan proper cache headers |
| **Data Boundary Testing** | Input text dengan karakter maksimum (contoh: 5000 karakter) | Sistem menerima dan menyimpan dengan benar, ada indikator character count |
| | Input dengan karakter khusus (Unicode, emoji, special symbols) | Karakter tersimpan dan ditampilkan dengan encoding yang benar |
| | Upload file dengan nama yang sangat panjang atau karakter khusus | Sistem handle dengan sanitize nama file dan penyimpanan yang aman |
| **Concurrent Operations** | Multiple siswa submit asesmen bersamaan | Semua submission tersimpan dengan timestamp yang akurat |
| | Guru dan admin edit data user bersamaan | Last update wins atau conflict resolution yang proper |
| | Mass enrollment/deletion operation | Batch operation berhasil dengan transaction rollback jika ada error |
| **System Resource Limits** | Disk space mendekati penuh | Sistem memberikan warning dan mencegah upload file baru |
| | Memory usage tinggi | Garbage collection berfungsi, tidak ada memory leak |
| | CPU usage spike | Sistem tetap responsive dengan proper resource management |
| **Authentication Edge Cases** | Password reset dengan email yang tidak valid | Sistem tidak expose informasi email existence demi security |
| | Multiple login attempts dengan password salah | Account lockout mechanism berfungsi setelah threshold tertentu |
| | Session management dengan multiple browser tabs | Session sharing antar tabs berfungsi, logout dari satu tab affect semua |
| **File System Issues** | Corrupt file upload | Sistem detect corrupt file dan menolak dengan pesan error |
| | File extension yang tidak diizinkan | Upload ditolak dengan daftar extension yang diizinkan |
| | Virus/malware dalam uploaded file | Antivirus scanning (jika ada) mendeteksi dan blok file berbahaya |

## **Pengujian Integration**

| Modul / Fitur | Skenario Pengujian (Test Case) | Hasil yang Diharapkan |
|---------------|--------------------------------|------------------------|
| **Database Integration** | CRUD operations pada semua tabel | Data consistency terjaga, foreign key constraints berfungsi |
| | Database migration dan schema changes | Migration berjalan lancar tanpa data loss |
| | Database backup dan recovery | Data integrity terjaga setelah recovery process |
| **External Services** | Email notification system | Email terkirim dengan benar untuk reset password, enrollment, dll |
| | File storage service (jika menggunakan cloud) | File upload/download integration berfungsi dengan service provider |
| | Third-party authentication (jika ada) | OAuth/SSO integration berfungsi dengan provider eksternal |
| **API Integration** | REST API endpoint testing | Semua API return response sesuai spec, error handling yang proper |
| | API rate limiting | Rate limit berfungsi mencegah abuse, return appropriate HTTP status |
| | API versioning | Backward compatibility terjaga ketika ada API version baru |
| **Cross-Module Integration** | Enrollment affect course access | Siswa yang di-enroll otomatis dapat akses course dan materials |
| | Grade calculation affect transcript | Nilai asesmen dan proyek terintegrasi dalam perhitungan nilai akhir |
| | User role change affect permissions | Permission update real-time ketika admin change user role |

---

> **Note**: Tabel pengujian ini mencakup semua aspek sistem LMS mulai dari fungsionalitas dasar hingga edge cases dan integration testing. Setiap test case dirancang untuk memastikan system reliability, security, dan user experience yang optimal.
