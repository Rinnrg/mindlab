"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

type Locale = 'id' | 'en'

interface AutoTranslateContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (text: string) => string
}

const AutoTranslateContext = createContext<AutoTranslateContextType | undefined>(undefined)

// Translation cache untuk performa
const translationCache = new Map<string, { id: string; en: string }>()

// Dictionary untuk common phrases (auto-populated)
const translationDict: Record<string, { id: string; en: string }> = {
  // Navigation & Common
  'Beranda': { id: 'Beranda', en: 'Home' },
  'Kursus': { id: 'Kursus', en: 'Courses' },
  'Tugas': { id: 'Tugas', en: 'Assignments' },
  'Proyek': { id: 'Proyek', en: 'Projects' },
  'Kalender': { id: 'Kalender', en: 'Calendar' },
  'Jadwal': { id: 'Jadwal', en: 'Schedule' },
  'Galeri': { id: 'Galeri', en: 'Gallery' },
  'Profil': { id: 'Profil', en: 'Profile' },
  'Pengaturan': { id: 'Pengaturan', en: 'Settings' },
  'Compiler': { id: 'Compiler', en: 'Compiler' },
  'Manajemen Role': { id: 'Manajemen Role', en: 'Role Management' },
  
  // Actions
  'Simpan': { id: 'Simpan', en: 'Save' },
  'Batal': { id: 'Batal', en: 'Cancel' },
  'Hapus': { id: 'Hapus', en: 'Delete' },
  'Edit': { id: 'Edit', en: 'Edit' },
  'Tambah': { id: 'Tambah', en: 'Add' },
  'Lihat': { id: 'Lihat', en: 'View' },
  'Cari': { id: 'Cari', en: 'Search' },
  'Filter': { id: 'Filter', en: 'Filter' },
  'Kembali': { id: 'Kembali', en: 'Back' },
  'Selanjutnya': { id: 'Selanjutnya', en: 'Next' },
  'Sebelumnya': { id: 'Sebelumnya', en: 'Previous' },
  'Kirim': { id: 'Kirim', en: 'Submit' },
  'Tutup': { id: 'Tutup', en: 'Close' },
  'Mulai': { id: 'Mulai', en: 'Start' },
  'Selesai': { id: 'Selesai', en: 'Completed' },
  'Keluar': { id: 'Keluar', en: 'Logout' },
  'common.start': { id: 'Mulai', en: 'Start' },
  'Bergabung': { id: 'Bergabung', en: 'Joined' },
  
  // Status
  'Aktif': { id: 'Aktif', en: 'Active' },
  'Dikumpulkan': { id: 'Dikumpulkan', en: 'Submitted' },
  'Tertunda': { id: 'Tertunda', en: 'Pending' },
  'Terlambat': { id: 'Terlambat', en: 'Overdue' },
  'Akan Datang': { id: 'Akan Datang', en: 'Upcoming' },
  'Mendatang': { id: 'Mendatang', en: 'Upcoming' },
  
  // Time
  'Hari Ini': { id: 'Hari Ini', en: 'Today' },
  'Kemarin': { id: 'Kemarin', en: 'Yesterday' },
  'Besok': { id: 'Besok', en: 'Tomorrow' },
  'Minggu Ini': { id: 'Minggu Ini', en: 'This Week' },
  'Bulan Ini': { id: 'Bulan Ini', en: 'This Month' },
  
  // Roles
  'Admin': { id: 'Admin', en: 'Admin' },
  'Guru': { id: 'Guru', en: 'Teacher' },
  'Siswa': { id: 'Siswa', en: 'Student' },
  
  // Academic
  'Materi': { id: 'Materi', en: 'Material' },
  'Pembelajaran': { id: 'Pembelajaran', en: 'Learning' },
  'Pelajaran': { id: 'Pelajaran', en: 'Lesson' },
  'Asesmen': { id: 'Asesmen', en: 'Assessment' },
  'Nilai': { id: 'Nilai', en: 'Grade' },
  'Hasil': { id: 'Hasil', en: 'Result' },
  
  // Common Phrases
  'Selamat Datang Kembali': { id: 'Selamat Datang Kembali', en: 'Welcome Back' },
  'Selamat Pagi': { id: 'Selamat Pagi', en: 'Good Morning' },
  'Selamat Siang': { id: 'Selamat Siang', en: 'Good Afternoon' },
  'Selamat Malam': { id: 'Selamat Malam', en: 'Good Evening' },
  'Tidak ada data': { id: 'Tidak ada data', en: 'No data' },
  'Tidak ada hasil': { id: 'Tidak ada hasil', en: 'No results' },
  'Memuat': { id: 'Memuat', en: 'Loading' },
  'Memuat...': { id: 'Memuat...', en: 'Loading...' },
  'Berhasil': { id: 'Berhasil', en: 'Success' },
  'Terjadi kesalahan': { id: 'Terjadi kesalahan', en: 'An error occurred' },
  'Lihat Semua': { id: 'Lihat Semua', en: 'View All' },
  'Lihat Kalender': { id: 'Lihat Kalender', en: 'View Calendar' },
  'Lanjutkan': { id: 'Lanjutkan', en: 'Continue' },
  'Buat Kursus': { id: 'Buat Kursus', en: 'Create Course' },
  'Kelola Proyek': { id: 'Kelola Proyek', en: 'Manage Projects' },
  
  // Dashboard
  'Ringkasan Sistem': { id: 'Ringkasan Sistem', en: 'System Overview' },
  'Total Pengguna': { id: 'Total Pengguna', en: 'Total Users' },
  'Siswa Aktif': { id: 'Siswa Aktif', en: 'Active Students' },
  'Instruktur': { id: 'Instruktur', en: 'Instructors' },
  'Kursus Anda': { id: 'Kursus Anda', en: 'Your Courses' },
  'Baru Diperbarui': { id: 'Baru Diperbarui', en: 'Recently Updated' },
  'Semua Kursus': { id: 'Semua Kursus', en: 'All Courses' },
  'Proyek Mendatang': { id: 'Proyek Mendatang', en: 'Upcoming Projects' },
  'dashboard.readyToTake': { id: 'Siap Dikerjakan', en: 'Ready to Take' },
  'dashboard.recentAssessments': { id: 'Asesmen Terbaru', en: 'Recent Assessments' },
  'dashboard.recentActivity': { id: 'Aktivitas Terbaru', en: 'Recent Activity' },
  'dashboard.continueLearning': { id: 'Lanjutkan Belajar', en: 'Continue Learning' },
  'dashboard.pickUpWhereLeft': { id: 'Ambil di mana Anda tinggalkan', en: 'Pick up where you left off' },
  'dashboard.trackProgress': { id: 'Pantau perkembangan belajar Anda', en: 'Track your learning progress' },
  'common.questions': { id: 'soal', en: 'questions' },
  'Soal': { id: 'Soal', en: 'Questions' },
  'Ambil di mana Anda tinggalkan': { id: 'Ambil di mana Anda tinggalkan', en: 'Pick up where you left off' },
  'Lanjutkan Belajar': { id: 'Lanjutkan Belajar', en: 'Continue Learning' },
  'Pantau perkembangan belajar Anda': { id: 'Pantau perkembangan belajar Anda', en: 'Track your learning progress' },
  'Kelola kursus dan materi pembelajaran': { id: 'Kelola kursus dan materi pembelajaran', en: 'Manage courses and learning materials' },
  
  // Users Management
  'Manajemen Pengguna': { id: 'Manajemen Pengguna', en: 'User Management' },
  'Kelola data pengguna sistem Mindlab': { id: 'Kelola data pengguna sistem Mindlab', en: 'Manage Mindlab system users data' },
  'Impor Pengguna': { id: 'Impor Pengguna', en: 'Import Users' },
  'Ekspor Pengguna': { id: 'Ekspor Pengguna', en: 'Export Users' },
  'Tambah Pengguna': { id: 'Tambah Pengguna', en: 'Add User' },
  'Hapus Pengguna': { id: 'Hapus Pengguna', en: 'Delete User' },
  'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.': {
    id: 'Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.',
    en: 'Are you sure you want to delete this user? This action cannot be undone.'
  },
  'berhasil dihapus': { id: 'berhasil dihapus', en: 'successfully deleted' },
  'Impor Data Pengguna': { id: 'Impor Data Pengguna', en: 'Import User Data' },
  'Upload file CSV atau Excel untuk menambahkan banyak pengguna sekaligus': {
    id: 'Upload file CSV atau Excel untuk menambahkan banyak pengguna sekaligus',
    en: 'Upload CSV or Excel file to add multiple users at once'
  },
  'Seret dan lepas file di sini': { id: 'Seret dan lepas file di sini', en: 'Drag and drop file here' },
  'Pilih File': { id: 'Pilih File', en: 'Browse Files' },
  'Unduh Template': { id: 'Unduh Template', en: 'Download Template' },
  'atau': { id: 'atau', en: 'or' },
  'Role': { id: 'Role', en: 'Role' },
  'Cari pengguna...': { id: 'Cari pengguna...', en: 'Search users...' },
  'Filter berdasarkan role': { id: 'Filter berdasarkan role', en: 'Filter by role' },
  'Semua Role': { id: 'Semua Role', en: 'All Roles' },
  'Pengguna': { id: 'Pengguna', en: 'Users' },
  'Tanggal Bergabung': { id: 'Tanggal Bergabung', en: 'Join Date' },
  'Gagal memuat data pengguna': { id: 'Gagal memuat data pengguna', en: 'Failed to load user data' },
  'Data pengguna berhasil diperbarui': { id: 'Data pengguna berhasil diperbarui', en: 'User data updated successfully' },
  'Gagal memperbarui data pengguna': { id: 'Gagal memperbarui data pengguna', en: 'Failed to update user data' },
  'Kembali ke Daftar Pengguna': { id: 'Kembali ke Daftar Pengguna', en: 'Back to User List' },
  'Edit Pengguna': { id: 'Edit Pengguna', en: 'Edit User' },
  'Perbarui informasi pengguna': { id: 'Perbarui informasi pengguna', en: 'Update user information' },
  'Foto Profil': { id: 'Foto Profil', en: 'Profile Photo' },
  'Upload foto profil pengguna (maks 2MB)': { id: 'Upload foto profil pengguna (maks 2MB)', en: 'Upload user profile photo (max 2MB)' },
  'Upload Foto': { id: 'Upload Foto', en: 'Upload Photo' },
  'Masukkan nama lengkap': { id: 'Masukkan nama lengkap', en: 'Enter full name' },
  'Masukkan email': { id: 'Masukkan email', en: 'Enter email' },
  'Masukkan username': { id: 'Masukkan username', en: 'Enter username' },
  'Pilih role': { id: 'Pilih role', en: 'Select role' },
  'Nama Lengkap': { id: 'Nama Lengkap', en: 'Full Name' },
  'Username': { id: 'Username', en: 'Username' },
  'Email': { id: 'Email', en: 'Email' },
  
  // Courses
  'Hapus Kursus': { id: 'Hapus Kursus', en: 'Delete Course' },
  'Apakah Anda yakin ingin menghapus kursus ini?': { id: 'Apakah Anda yakin ingin menghapus kursus ini?', en: 'Are you sure you want to delete this course?' },
  
  // Header
  'Ganti Tampilan': { id: 'Ganti Tampilan', en: 'Switch View' },
  
  // Profile & Settings
  'Edit Profil': { id: 'Edit Profil', en: 'Edit Profile' },
  'Informasi Profil': { id: 'Informasi Profil', en: 'Profile Information' },
  'Perbarui informasi profil Anda': { id: 'Perbarui informasi profil Anda', en: 'Update your profile information' },
  'Ubah Avatar': { id: 'Ubah Avatar', en: 'Change Avatar' },
  'Bio': { id: 'Bio', en: 'Bio' },
  'Ceritakan tentang diri Anda...': { id: 'Ceritakan tentang diri Anda...', en: 'Tell us about yourself...' },
  'Simpan Perubahan': { id: 'Simpan Perubahan', en: 'Save Changes' },
  'Tersimpan': { id: 'Tersimpan', en: 'Saved' },
  'Notifikasi': { id: 'Notifikasi', en: 'Notifications' },
  'Preferensi Notifikasi': { id: 'Preferensi Notifikasi', en: 'Notification Preferences' },
  'Kelola notifikasi dan pemberitahuan Anda': { id: 'Kelola notifikasi dan pemberitahuan Anda', en: 'Manage your notifications and alerts' },
  'Pengingat Tugas': { id: 'Pengingat Tugas', en: 'Assignment Reminders' },
  'Terima notifikasi untuk tugas yang akan datang': { id: 'Terima notifikasi untuk tugas yang akan datang', en: 'Receive notifications for upcoming assignments' },
  'Notifikasi Penilaian': { id: 'Notifikasi Penilaian', en: 'Grading Notifications' },
  'Dapatkan pemberitahuan saat nilai Anda tersedia': { id: 'Dapatkan pemberitahuan saat nilai Anda tersedia', en: 'Get notified when your grades are available' },
  'Update Proyek': { id: 'Update Proyek', en: 'Project Updates' },
  'Notifikasi tentang perubahan proyek dan feedback': { id: 'Notifikasi tentang perubahan proyek dan feedback', en: 'Notifications about project changes and feedback' },
  'Pengumuman Kursus': { id: 'Pengumuman Kursus', en: 'Course Announcements' },
  'Terima pengumuman penting dari instruktur': { id: 'Terima pengumuman penting dari instruktur', en: 'Receive important announcements from instructors' },
  'Notifikasi Email': { id: 'Notifikasi Email', en: 'Email Notifications' },
  'Terima notifikasi melalui email': { id: 'Terima notifikasi melalui email', en: 'Receive notifications via email' },
  'Tampilan': { id: 'Tampilan', en: 'Appearance' },
  'Sesuaikan tampilan aplikasi sesuai preferensi Anda': { id: 'Sesuaikan tampilan aplikasi sesuai preferensi Anda', en: 'Customize app appearance to your preference' },
  'Tema': { id: 'Tema', en: 'Theme' },
  'Terang': { id: 'Terang', en: 'Light' },
  'Gelap': { id: 'Gelap', en: 'Dark' },
  'Sistem': { id: 'Sistem', en: 'System' },
  'Bahasa': { id: 'Bahasa', en: 'Language' },
  'Keamanan': { id: 'Keamanan', en: 'Security' },
  'Pengaturan Keamanan': { id: 'Pengaturan Keamanan', en: 'Security Settings' },
  'Kelola kata sandi dan keamanan akun Anda': { id: 'Kelola kata sandi dan keamanan akun Anda', en: 'Manage your password and account security' },
  'Kata Sandi Saat Ini': { id: 'Kata Sandi Saat Ini', en: 'Current Password' },
  'Masukkan kata sandi saat ini': { id: 'Masukkan kata sandi saat ini', en: 'Enter your current password' },
  'Kata Sandi Baru': { id: 'Kata Sandi Baru', en: 'New Password' },
  'Masukkan kata sandi baru': { id: 'Masukkan kata sandi baru', en: 'Enter your new password' },
  'Konfirmasi Kata Sandi': { id: 'Konfirmasi Kata Sandi', en: 'Confirm Password' },
  'Konfirmasi kata sandi baru': { id: 'Konfirmasi kata sandi baru', en: 'Confirm your new password' },
  'Perbarui Kata Sandi': { id: 'Perbarui Kata Sandi', en: 'Update Password' },
  'Zona Bahaya': { id: 'Zona Bahaya', en: 'Danger Zone' },
  'Tindakan permanen yang tidak dapat dibatalkan': { id: 'Tindakan permanen yang tidak dapat dibatalkan', en: 'Permanent actions that cannot be undone' },
  'Hapus Akun': { id: 'Hapus Akun', en: 'Delete Account' },
  'Kelola preferensi akun dan pengaturan Anda': { id: 'Kelola preferensi akun dan pengaturan Anda', en: 'Manage your account preferences and settings' },
  'navigation.profileMenu': { id: 'Profil', en: 'Profile' },
  'Peran': { id: 'Peran', en: 'Role' },
  'Anda yakin ingin memperbarui kata sandi?': { id: 'Anda yakin ingin memperbarui kata sandi?', en: 'Are you sure you want to update your password?' },
  'Perbarui': { id: 'Perbarui', en: 'Update' },
  'Kata sandi berhasil diperbarui': { id: 'Kata sandi berhasil diperbarui', en: 'Password updated successfully' },
  'Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.': { id: 'Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.', en: 'This action cannot be undone. All your data will be permanently deleted.' },
  'Ya, Hapus': { id: 'Ya, Hapus', en: 'Yes, Delete' },
  'Profil berhasil disimpan': { id: 'Profil berhasil disimpan', en: 'Profile saved successfully' },
  'Kursus Diikuti': { id: 'Kursus Diikuti', en: 'Enrolled Courses' },
  'Nilai Rata-rata': { id: 'Nilai Rata-rata', en: 'Average Grade' },
  'Siap Dikerjakan': { id: 'Siap Dikerjakan', en: 'Ready to Take' },
  'Asesmen Terbaru': { id: 'Asesmen Terbaru', en: 'Recent Assessments' },
  'dashboard.createCourse': { id: 'Buat Kursus', en: 'Create Course' },
  'dashboard.activeCourses': { id: 'Kursus Aktif', en: 'Active Courses' },
  'courses.students': { id: 'Siswa', en: 'Students' },
  'dashboard.pendingReview': { id: 'Menunggu Review', en: 'Pending Review' },
  'dashboard.assessments': { id: 'Asesmen', en: 'Assessments' },
  'dashboard.upcoming': { id: 'Mendatang', en: 'Upcoming' },
  'common.yesterday': { id: 'Kemarin', en: 'Yesterday' },
  
  // Schedule Page
  'schedule': { id: 'Jadwal', en: 'Schedule' },
  'scheduleDesc': { id: 'Kelola dan lihat jadwal pembelajaran Anda', en: 'Manage and view your learning schedule' },
  'calendarView': { id: 'Tampilan Kalender', en: 'Calendar View' },
  'listView': { id: 'Tampilan Daftar', en: 'List View' },
  'filter': { id: 'Filter', en: 'Filter' },
  'allEvents': { id: 'Semua Event', en: 'All Events' },
  'assessment': { id: 'Asesmen', en: 'Assessment' },
  'project': { id: 'Proyek', en: 'Project' },
  'assignment': { id: 'Tugas', en: 'Assignment' },
  'lesson': { id: 'Pelajaran', en: 'Lesson' },
  'overdueItems': { id: 'item terlambat', en: 'overdue items' },
  'today': { id: 'Hari Ini', en: 'Today' },
  'noEvents': { id: 'Tidak ada event', en: 'No events' },
  'selectDate': { id: 'Pilih Tanggal', en: 'Select Date' },
  'next7Days': { id: '7 Hari Ke Depan', en: 'Next 7 Days' },
  'noUpcoming': { id: 'Tidak ada event mendatang', en: 'No upcoming events' },
  'monthSummary': { id: 'Ringkasan Bulan', en: 'Month Summary' },
  
  // Compiler Page
  'back': { id: 'Kembali', en: 'Back' },
  'compilerTitle': { id: 'Python Compiler', en: 'Python Compiler' },
  'compilerVersion': { id: 'Python 3.11 + Pyodide', en: 'Python 3.11 + Pyodide' },
  'addCode': { id: 'Tambah Kode', en: 'Add Code' },
  'addText': { id: 'Tambah Teks', en: 'Add Text' },
  'packagesInstalled': { id: 'paket terinstall', en: 'packages installed' },
  'runAll': { id: 'Jalankan Semua', en: 'Run All' },
  'importFile': { id: 'Impor File', en: 'Import File' },
  'exportFile': { id: 'Ekspor File', en: 'Export File' },
  'printNotebook': { id: 'Cetak Notebook', en: 'Print Notebook' },
  'noCell': { id: 'Belum Ada Cell', en: 'No Cells Yet' },
  'noCellDesc': { id: 'Mulai dengan menambahkan cell kode atau teks', en: 'Start by adding a code or text cell' },
  'addNewCell': { id: 'Tambah Cell Baru', en: 'Add New Cell' },
  'writeMarkdown': { id: 'Tulis markdown di sini...', en: 'Write markdown here...' },
  'output': { id: 'Output', en: 'Output' },
  'copyOutput': { id: 'Salin', en: 'Copy' },
  'showOutput': { id: 'Tampilkan', en: 'Show' },
  'hideOutput': { id: 'Sembunyikan', en: 'Hide' },
  'outputCopied': { id: 'Output berhasil disalin!', en: 'Output copied successfully!' },

  // Activity Dropdown
  'Aktivitas Terbaru': { id: 'Aktivitas Terbaru', en: 'Recent Activity' },
  'baru': { id: 'baru', en: 'new' },
  'Tandai Semua': { id: 'Tandai Semua', en: 'Mark All' },
  'Tandai telah dibaca': { id: 'Tandai telah dibaca', en: 'Mark as read' },
  'Belum ada aktivitas': { id: 'Belum ada aktivitas', en: 'No activity yet' },
  'Aktivitas Anda akan muncul di sini': { id: 'Aktivitas Anda akan muncul di sini', en: 'Your activity will appear here' },
  'Menyelesaikan': { id: 'Menyelesaikan', en: 'Completed' },
  'Mengumpulkan': { id: 'Mengumpulkan', en: 'Submitted' },
  'Dinilai': { id: 'Dinilai', en: 'Graded' },

  // Profile Page
  'Total Kursus': { id: 'Total Kursus', en: 'Total Courses' },
  'Portofolio': { id: 'Portofolio', en: 'Portfolio' },
  'Rata-rata': { id: 'Rata-rata', en: 'Average' },
  'Tertinggi': { id: 'Tertinggi', en: 'Highest' },
  'Kursus Saya': { id: 'Kursus Saya', en: 'My Courses' },
  'Cari proyek...': { id: 'Cari proyek...', en: 'Search projects...' },
  'Urutkan': { id: 'Urutkan', en: 'Sort' },
  'Terbaru': { id: 'Terbaru', en: 'Newest' },
  'Nilai Tertinggi': { id: 'Nilai Tertinggi', en: 'Highest Grade' },
  'Abjad': { id: 'Abjad', en: 'Alphabetical' },
  'Belum ada proyek': { id: 'Belum ada proyek', en: 'No projects yet' },
  'Coba kata kunci lain': { id: 'Coba kata kunci lain', en: 'Try different keywords' },
  'Proyek terbaik Anda akan ditampilkan di sini': { id: 'Proyek terbaik Anda akan ditampilkan di sini', en: 'Your best projects will be displayed here' },
  'Lihat Detail': { id: 'Lihat Detail', en: 'View Details' },
  'Belum ada kursus': { id: 'Belum ada kursus', en: 'No courses yet' },
  'Anda belum membuat kursus': { id: 'Anda belum membuat kursus', en: 'You haven\'t created any courses yet' },
  'Anda belum terdaftar di kursus manapun': { id: 'Anda belum terdaftar di kursus manapun', en: 'You haven\'t enrolled in any courses yet' },
  'Lihat Kursus': { id: 'Lihat Kursus', en: 'View Course' },
  'Mengupload...': { id: 'Mengupload...', en: 'Uploading...' },
  'Foto profil berhasil diperbarui': { id: 'Foto profil berhasil diperbarui', en: 'Profile photo updated successfully' },
  'Gagal Upload': { id: 'Gagal Upload', en: 'Upload Failed' },
  'Terjadi kesalahan saat mengupload foto': { id: 'Terjadi kesalahan saat mengupload foto', en: 'An error occurred while uploading photo' },

  // Courses Page
  'courses.instructor': { id: 'Instruktur', en: 'Instructor' },
  'courses.viewCourse': { id: 'Lihat Kursus', en: 'View Course' },
  'Cari kursus...': { id: 'Cari kursus...', en: 'Search courses...' },
  'Semua Kategori': { id: 'Semua Kategori', en: 'All Categories' },
  'Tambah Kursus': { id: 'Tambah Kursus', en: 'Add Course' },
  'Kursus Tersedia': { id: 'Kursus Tersedia', en: 'Available Courses' },
  'kursus ditemukan': { id: 'kursus ditemukan', en: 'courses found' },
  'Tidak ada kursus': { id: 'Tidak ada kursus', en: 'No courses' },
  'Tidak ada kursus ditemukan': { id: 'Tidak ada kursus ditemukan', en: 'No courses found' },
  'Coba ubah filter atau kata kunci pencarian': { id: 'Coba ubah filter atau kata kunci pencarian', en: 'Try changing filter or search keywords' },
  'Detail Kursus': { id: 'Detail Kursus', en: 'Course Details' },
  'Deskripsi': { id: 'Deskripsi', en: 'Description' },
  'Kategori': { id: 'Kategori', en: 'Category' },
  'Tanggal Dibuat': { id: 'Tanggal Dibuat', en: 'Date Created' },
  'Daftar Materi': { id: 'Daftar Materi', en: 'Material List' },
  'Daftar Asesmen': { id: 'Daftar Asesmen', en: 'Assessment List' },
  'Daftar Siswa': { id: 'Daftar Siswa', en: 'Student List' },
  'Tambah Materi': { id: 'Tambah Materi', en: 'Add Material' },
  'Tambah Asesmen': { id: 'Tambah Asesmen', en: 'Add Assessment' },
  'Tambah Siswa': { id: 'Tambah Siswa', en: 'Add Student' },
  'Edit Kursus': { id: 'Edit Kursus', en: 'Edit Course' },
  'Judul': { id: 'Judul', en: 'Title' },
  'Judul Kursus': { id: 'Judul Kursus', en: 'Course Title' },
  'Deskripsi Kursus': { id: 'Deskripsi Kursus', en: 'Course Description' },
  'Gambar Kursus': { id: 'Gambar Kursus', en: 'Course Image' },
  'Buat Kursus Baru': { id: 'Buat Kursus Baru', en: 'Create New Course' },
  'Isi detail kursus yang ingin Anda buat': { id: 'Isi detail kursus yang ingin Anda buat', en: 'Fill in the details of the course you want to create' },
  'Kembali ke Kursus': { id: 'Kembali ke Kursus', en: 'Back to Courses' },

  // Materi
  'Judul Materi': { id: 'Judul Materi', en: 'Material Title' },
  'Konten': { id: 'Konten', en: 'Content' },
  'Lampiran': { id: 'Lampiran', en: 'Attachment' },
  'File Lampiran': { id: 'File Lampiran', en: 'Attachment File' },
  'Tanggal Unggah': { id: 'Tanggal Unggah', en: 'Upload Date' },
  'Edit Materi': { id: 'Edit Materi', en: 'Edit Material' },
  'Buat Materi Baru': { id: 'Buat Materi Baru', en: 'Create New Material' },
  'Belum ada materi': { id: 'Belum ada materi', en: 'No materials yet' },
  'Kembali ke Detail Kursus': { id: 'Kembali ke Detail Kursus', en: 'Back to Course Details' },

  // Asesmen
  'Judul Asesmen': { id: 'Judul Asesmen', en: 'Assessment Title' },
  'Tipe Asesmen': { id: 'Tipe Asesmen', en: 'Assessment Type' },
  'Tenggat Waktu': { id: 'Tenggat Waktu', en: 'Deadline' },
  'Batas Waktu': { id: 'Batas Waktu', en: 'Time Limit' },
  'Belum ada asesmen': { id: 'Belum ada asesmen', en: 'No assessments yet' },
  'Buat Asesmen Baru': { id: 'Buat Asesmen Baru', en: 'Create New Assessment' },
  'Edit Asesmen': { id: 'Edit Asesmen', en: 'Edit Assessment' },
  'Kumpulkan': { id: 'Kumpulkan', en: 'Submit' },
  'Kuis': { id: 'Kuis', en: 'Quiz' },
  'Penugasan': { id: 'Penugasan', en: 'Assignment' },
  'Pengumpulan': { id: 'Pengumpulan', en: 'Submissions' },
  'Belum dikumpulkan': { id: 'Belum dikumpulkan', en: 'Not submitted' },
  'Sudah dikumpulkan': { id: 'Sudah dikumpulkan', en: 'Already submitted' },
  'Jawaban': { id: 'Jawaban', en: 'Answer' },
  'Pertanyaan': { id: 'Pertanyaan', en: 'Question' },
  'menit': { id: 'menit', en: 'minutes' },

  // Projects
  'Proyek Saya': { id: 'Proyek Saya', en: 'My Projects' },
  'Cari proyek': { id: 'Cari proyek', en: 'Search projects' },
  'Tambah Proyek': { id: 'Tambah Proyek', en: 'Add Project' },
  'Edit Proyek': { id: 'Edit Proyek', en: 'Edit Project' },
  'Detail Proyek': { id: 'Detail Proyek', en: 'Project Details' },
  'Kelompok': { id: 'Kelompok', en: 'Groups' },
  'Anggota': { id: 'Anggota', en: 'Members' },
  'Tanggal Mulai': { id: 'Tanggal Mulai', en: 'Start Date' },
  'Tanggal Selesai': { id: 'Tanggal Selesai', en: 'End Date' },
  'Sedang Berlangsung': { id: 'Sedang Berlangsung', en: 'In Progress' },
  'Belum Dimulai': { id: 'Belum Dimulai', en: 'Not Started' },
  'Sintaks': { id: 'Sintaks', en: 'Syntax' },
  'Belum ada proyek yang dibuat': { id: 'Belum ada proyek yang dibuat', en: 'No projects created yet' },
  'Kelola Kelompok': { id: 'Kelola Kelompok', en: 'Manage Groups' },
  'Buat Proyek Baru': { id: 'Buat Proyek Baru', en: 'Create New Project' },
  'Kembali ke Proyek': { id: 'Kembali ke Proyek', en: 'Back to Projects' },

  // Users Management extras
  'Aksi': { id: 'Aksi', en: 'Actions' },
  'Status': { id: 'Status', en: 'Status' },
  'Nama': { id: 'Nama', en: 'Name' },
  'Kata Sandi': { id: 'Kata Sandi', en: 'Password' },
  'Konfirmasi': { id: 'Konfirmasi', en: 'Confirm' },
  'Ya': { id: 'Ya', en: 'Yes' },
  'Tidak': { id: 'Tidak', en: 'No' },
  'Berhasil!': { id: 'Berhasil!', en: 'Success!' },
  'Gagal': { id: 'Gagal', en: 'Failed' },
  'Memproses...': { id: 'Memproses...', en: 'Processing...' },
  'Menyimpan...': { id: 'Menyimpan...', en: 'Saving...' },
  'Menghapus...': { id: 'Menghapus...', en: 'Deleting...' },
  'Yakin?': { id: 'Yakin?', en: 'Are you sure?' },

  // Login
  'Masuk': { id: 'Masuk', en: 'Login' },
  'Masuk ke akun Anda': { id: 'Masuk ke akun Anda', en: 'Log in to your account' },
  'Ingat saya': { id: 'Ingat saya', en: 'Remember me' },
  'Lupa kata sandi?': { id: 'Lupa kata sandi?', en: 'Forgot password?' },

  // Common misc
  'Pilih': { id: 'Pilih', en: 'Select' },
  'Unggah': { id: 'Unggah', en: 'Upload' },
  'Unduh': { id: 'Unduh', en: 'Download' },
  'Salin': { id: 'Salin', en: 'Copy' },
  'Tempel': { id: 'Tempel', en: 'Paste' },
  'Muat Ulang': { id: 'Muat Ulang', en: 'Reload' },
  'Lainnya': { id: 'Lainnya', en: 'More' },
  'Tampilkan Semua': { id: 'Tampilkan Semua', en: 'Show All' },
  'Sembunyikan': { id: 'Sembunyikan', en: 'Hide' },
  'Tampilkan': { id: 'Tampilkan', en: 'Show' },
  'Konfirmasi Logout': { id: 'Konfirmasi Logout', en: 'Confirm Logout' },
  'Apakah Anda yakin ingin keluar?': { id: 'Apakah Anda yakin ingin keluar?', en: 'Are you sure you want to logout?' },
  'Ya, Keluar': { id: 'Ya, Keluar', en: 'Yes, Logout' },
  'Anda telah logout.': { id: 'Anda telah logout.', en: 'You have been logged out.' },
  'Belum ada data': { id: 'Belum ada data', en: 'No data yet' },
  'Tidak ditemukan': { id: 'Tidak ditemukan', en: 'Not found' },
  'Halaman tidak ditemukan': { id: 'Halaman tidak ditemukan', en: 'Page not found' },
  'Kembali ke beranda': { id: 'Kembali ke beranda', en: 'Back to home' },
  'Tindakan': { id: 'Tindakan', en: 'Action' },
  'Hasil Pencarian': { id: 'Hasil Pencarian', en: 'Search Results' },
  'Tidak ada hasil pencarian': { id: 'Tidak ada hasil pencarian', en: 'No search results' },
  'Cari...': { id: 'Cari...', en: 'Search...' },
  'Ketik untuk mencari...': { id: 'Ketik untuk mencari...', en: 'Type to search...' },
  'Tipe': { id: 'Tipe', en: 'Type' },
  'Tanggal': { id: 'Tanggal', en: 'Date' },
  'Waktu': { id: 'Waktu', en: 'Time' },
  'Jam': { id: 'Jam', en: 'Hours' },
  'Hari': { id: 'Hari', en: 'Days' },
  'Minggu': { id: 'Minggu', en: 'Weeks' },
  'Bulan': { id: 'Bulan', en: 'Months' },
  'Tahun': { id: 'Tahun', en: 'Years' },
  'dari': { id: 'dari', en: 'from' },
  'sampai': { id: 'sampai', en: 'until' },
  'Semua': { id: 'Semua', en: 'All' },
  'Dipilih': { id: 'Dipilih', en: 'Selected' },
  'kosong': { id: 'kosong', en: 'empty' },
  'Wajib diisi': { id: 'Wajib diisi', en: 'Required' },
  'Opsional': { id: 'Opsional', en: 'Optional' },
  'Data berhasil disimpan': { id: 'Data berhasil disimpan', en: 'Data saved successfully' },
  'Data berhasil dihapus': { id: 'Data berhasil dihapus', en: 'Data deleted successfully' },
  'Data berhasil diperbarui': { id: 'Data berhasil diperbarui', en: 'Data updated successfully' },
}

// Simple word-by-word translation fallback
const wordTranslations: Record<string, string> = {
  'selamat': 'welcome',
  'datang': 'come',
  'kembali': 'back',
  'pagi': 'morning',
  'siang': 'afternoon',
  'malam': 'evening',
  'semua': 'all',
  'tidak': 'no',
  'ada': 'any',
  'data': 'data',
  'hasil': 'result',
  'cari': 'search',
  'apapun': 'anything',
  'tambah': 'add',
  'baru': 'new',
  'lihat': 'view',
  'detail': 'details',
  'total': 'total',
  'aktif': 'active',
  'selesai': 'completed',
  'tertunda': 'pending',
  'terlambat': 'overdue',
  'dikumpulkan': 'submitted',
  'akan': 'upcoming',
  'hari': 'day',
  'ini': 'this',
  'kemarin': 'yesterday',
  'besok': 'tomorrow',
  'minggu': 'week',
  'bulan': 'month',
  'tahun': 'year',
  'dari': 'from',
  'ke': 'to',
  'di': 'in',
  'pada': 'at',
  'untuk': 'for',
  'dengan': 'with',
  'atau': 'or',
  'dan': 'and',
  'kursus': 'course',
  'tugas': 'assignment',
  'proyek': 'project',
  'materi': 'material',
  'pembelajaran': 'learning',
  'pelajaran': 'lesson',
  'asesmen': 'assessment',
  'nilai': 'grade',
  'siswa': 'student',
  'guru': 'teacher',
  'admin': 'admin',
  'pengguna': 'user',
  'profil': 'profile',
  'pengaturan': 'settings',
  'jadwal': 'schedule',
  'kalender': 'calendar',
  'galeri': 'gallery',
  'compiler': 'compiler',
  'manajemen': 'management',
  'role': 'role',
  'beranda': 'home',
  'keluar': 'logout',
  'masuk': 'login',
  'simpan': 'save',
  'hapus': 'delete',
  'edit': 'edit',
  'batal': 'cancel',
  'kirim': 'submit',
  'tutup': 'close',
  'mulai': 'start',
  'sebelumnya': 'previous',
  'selanjutnya': 'next',
  'memuat': 'loading',
  'berhasil': 'success',
  'gagal': 'failed',
  'terjadi': 'occurred',
  'kesalahan': 'error',
  'belum': 'not yet',
  'sudah': 'already',
  'sedang': 'currently',
  'perbarui': 'update',
  'ubah': 'change',
  'kelola': 'manage',
  'daftar': 'list',
  'judul': 'title',
  'deskripsi': 'description',
  'kategori': 'category',
  'tanggal': 'date',
  'waktu': 'time',
  'status': 'status',
  'aksi': 'action',
  'pilih': 'select',
  'unggah': 'upload',
  'unduh': 'download',
  'salin': 'copy',
  'tempel': 'paste',
  'nama': 'name',
  'email': 'email',
  'kata': 'word',
  'sandi': 'password',
  'konten': 'content',
  'lampiran': 'attachment',
  'jawaban': 'answer',
  'pertanyaan': 'question',
  'soal': 'question',
  'kelompok': 'group',
  'anggota': 'member',
  'instruktur': 'instructor',
  'portofolio': 'portfolio',
  'rata-rata': 'average',
  'tertinggi': 'highest',
  'terbaru': 'newest',
  'tema': 'theme',
  'terang': 'light',
  'gelap': 'dark',
  'bahasa': 'language',
  'keamanan': 'security',
  'tampilan': 'appearance',
  'notifikasi': 'notification',
  'pengumuman': 'announcement',
  'penilaian': 'grading',
  'pengingat': 'reminder',
  'preferensi': 'preference',
  'ringkasan': 'summary',
  'sistem': 'system',
  'dibuat': 'created',
  'diperbarui': 'updated',
  'dihapus': 'deleted',
  'disimpan': 'saved',
  'ditemukan': 'found',
  'tersedia': 'available',
  'kosong': 'empty',
  'wajib': 'required',
  'opsional': 'optional',
  'menit': 'minutes',
  'jam': 'hours',
  'detik': 'seconds',
  'berlangsung': 'ongoing',
  'mendatang': 'upcoming',
  'lalu': 'ago',
  'yang': 'that',
  'adalah': 'is',
  'tersimpan': 'saved',
  'tindakan': 'action',
  'permanen': 'permanent',
  'dibatalkan': 'cancelled',
  'zona': 'zone',
  'bahaya': 'danger',
  'akun': 'account',
  'aktivitas': 'activity',
  'menyelesaikan': 'completed',
  'mengumpulkan': 'submitted',
  'dinilai': 'graded',
  'bergabung': 'joined',
  'tandai': 'mark',
  'dibaca': 'read',
  'muncul': 'appear',
  'foto': 'photo',
  'gambar': 'image',
  'kode': 'code',
  'teks': 'text',
  'file': 'file',
  'halaman': 'page',
  'pencarian': 'search',
  'ketik': 'type',
  'seret': 'drag',
  'lepas': 'drop',
}

// Auto-translate function
function autoTranslate(text: string, targetLocale: Locale): string {
  if (!text) return text
  
  // If target is Indonesian, return as-is (source language is Indonesian)
  if (targetLocale === 'id') return text
  
  // Check cache first
  const cacheKey = text.toLowerCase().trim()
  if (translationCache.has(cacheKey)) {
    const cached = translationCache.get(cacheKey)!
    return cached[targetLocale]
  }
  
  // Check dictionary (exact match)
  const dictKey = text.trim()
  if (translationDict[dictKey]) {
    const translation = translationDict[dictKey]
    translationCache.set(cacheKey, translation)
    return translation[targetLocale]
  }
  
  // Check dictionary (case-insensitive match)
  const dictKeyLower = dictKey.toLowerCase()
  for (const [key, value] of Object.entries(translationDict)) {
    if (key.toLowerCase() === dictKeyLower) {
      translationCache.set(cacheKey, value)
      return value[targetLocale]
    }
  }
  
  // Fallback: word-by-word translation for Indonesian -> English
  const words = text.split(/(\s+)/) // Keep whitespace separators
  const translatedWords = words.map(segment => {
    // Skip whitespace segments
    if (/^\s+$/.test(segment)) return segment
    
    // Handle punctuation
    const punctMatch = segment.match(/^([^\w]*)([\w\-]+)([^\w]*)$/)
    if (punctMatch) {
      const [, prefix, word, suffix] = punctMatch
      const lowerWord = word.toLowerCase()
      const translated = wordTranslations[lowerWord]
      if (translated) {
        // Preserve capitalization
        if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase()) {
          return prefix + translated.charAt(0).toUpperCase() + translated.slice(1) + suffix
        }
        return prefix + translated + suffix
      }
      return segment
    }
    return segment
  })
  
  const result = translatedWords.join('')
  
  // Cache the result
  const translation = { id: text, en: result }
  translationCache.set(cacheKey, translation)
  
  return result
}

export function AutoTranslateProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id')

  // Load saved locale from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved && (saved === 'id' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }, [])

  const t = useCallback((text: string) => {
    return autoTranslate(text, locale)
  }, [locale])

  return (
    <AutoTranslateContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </AutoTranslateContext.Provider>
  )
}

export function useAutoTranslate() {
  const context = useContext(AutoTranslateContext)
  if (!context) {
    throw new Error('useAutoTranslate must be used within AutoTranslateProvider')
  }
  return context
}

// Alias untuk compatibility
export const useTranslate = useAutoTranslate
export const useT = () => {
  const { t } = useAutoTranslate()
  return t
}
