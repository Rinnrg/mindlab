# Black Box Testing - Role Siswa

## Deskripsi
Pengujian black box untuk semua fitur yang dapat diakses oleh role **Siswa** dalam sistem LMS. Testing difokuskan pada pengalaman belajar dan interaksi dengan materi.

## Test Environment
- **Role**: Siswa
- **Access Level**: Course Access, Assessment, Project Submission, Forum
- **Browser**: Chrome, Firefox, Edge, Mobile Safari
- **Device**: Desktop, Tablet, Mobile

---

## 1. Akses Course dan Materi

### TC-SIS-001: Akses Course yang Di-enroll
| Test Case ID | TC-SIS-001 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengakses course yang sudah di-enroll |
| **Precondition** | - Siswa sudah login<br>- Siswa sudah di-enroll ke course |
| **Test Steps** | 1. Login sebagai siswa<br>2. Lihat dashboard course<br>3. Klik course yang sudah di-enroll<br>4. Akses materi dalam course |
| **Test Data** | Course: "Matematika Dasar" |
| **Expected Result** | - Course terlihat di dashboard<br>- Dapat mengakses semua materi<br>- Navigation course berfungsi<br>- Progress tracking terlihat |
| **Priority** | High |

### TC-SIS-002: Download Materi File
| Test Case ID | TC-SIS-002 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mendownload file materi |
| **Precondition** | - Siswa sudah login<br>- Berada di course yang memiliki materi |
| **Test Steps** | 1. Masuk ke course<br>2. Pilih materi dengan file lampiran<br>3. Klik tombol "Download"<br>4. Verifikasi file terdownload |
| **Test Data** | File: "algoritma.pdf" (2MB) |
| **Expected Result** | - File berhasil didownload<br>- File tidak corrupt<br>- Dapat dibuka dengan aplikasi sesuai<br>- Download speed acceptable |
| **Priority** | High |

### TC-SIS-003: View Materi Online
| Test Case ID | TC-SIS-003 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat preview materi secara online |
| **Precondition** | - Siswa sudah login<br>- Materi sudah tersedia |
| **Test Steps** | 1. Masuk ke course<br>2. Klik materi<br>3. Lihat preview file (PDF/PPT)<br>4. Navigate halaman preview |
| **Test Data** | Materi dengan PDF 10 halaman |
| **Expected Result** | - Preview file tampil dengan benar<br>- Navigation antar halaman smooth<br>- Zoom functionality bekerja<br>- Loading time acceptable |
| **Priority** | Medium |

### TC-SIS-004: Akses Course Unauthorized
| Test Case ID | TC-SIS-004 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa tidak dapat mengakses course yang tidak di-enroll |
| **Precondition** | - Siswa sudah login<br>- Ada course yang tidak di-enroll siswa |
| **Test Steps** | 1. Coba akses URL course langsung<br>2. Coba search course yang tidak diikuti |
| **Test Data** | Course: "Advanced Mathematics" (not enrolled) |
| **Expected Result** | - Access denied message<br>- Redirect ke dashboard<br>- No course content visible<br>- Proper error handling |
| **Priority** | High |

---

## 2. Asesmen dan Quiz

### TC-SIS-005: Mengerjakan Asesmen Pilihan Ganda
| Test Case ID | TC-SIS-005 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengerjakan dan submit asesmen pilihan ganda |
| **Precondition** | - Siswa sudah login<br>- Asesmen pilihan ganda tersedia<br>- Belum dikerjakan |
| **Test Steps** | 1. Masuk ke course<br>2. Klik asesmen yang tersedia<br>3. Jawab semua soal pilihan ganda<br>4. Review jawaban<br>5. Submit asesmen |
| **Test Data** | Asesmen: 10 soal pilihan ganda<br>Time limit: 30 menit |
| **Expected Result** | - Dapat mengakses asesmen<br>- Timer countdown berfungsi<br>- Dapat memilih jawaban<br>- Auto-submit saat time up<br>- Nilai otomatis muncul |
| **Priority** | High |

### TC-SIS-006: Mengerjakan Asesmen Essay
| Test Case ID | TC-SIS-006 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengerjakan asesmen essay |
| **Precondition** | - Siswa sudah login<br>- Asesmen essay tersedia |
| **Test Steps** | 1. Akses asesmen essay<br>2. Baca pertanyaan<br>3. Tulis jawaban di text area<br>4. Save draft (jika ada)<br>5. Submit final answer |
| **Test Data** | Essay question: "Explain bubble sort algorithm" |
| **Expected Result** | - Text editor berfungsi dengan baik<br>- Auto-save draft bekerja<br>- Character count tersedia<br>- Submit berhasil<br>- Status "menunggu penilaian" |
| **Priority** | High |

### TC-SIS-007: Lihat Hasil Asesmen
| Test Case ID | TC-SIS-007 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat hasil asesmen yang telah dinilai |
| **Precondition** | - Siswa sudah mengerjakan asesmen<br>- Guru sudah memberikan nilai |
| **Test Steps** | 1. Masuk ke dashboard<br>2. Klik "Hasil Asesmen"<br>3. Pilih asesmen yang sudah dinilai<br>4. Lihat detail nilai dan feedback |
| **Test Data** | - |
| **Expected Result** | - Nilai tampil dengan jelas<br>- Feedback guru terlihat<br>- Breakdown nilai (jika ada)<br>- Perbandingan dengan rata-rata |
| **Priority** | Medium |

### TC-SIS-008: Proctoring - Mouse Keluar Area
| Test Case ID | TC-SIS-008 |
|--------------|------------|
| **Test Objective** | Memverifikasi sistem proctoring mendeteksi mouse keluar area asesmen |
| **Precondition** | - Siswa sudah mulai mengerjakan asesmen<br>- Proctoring aktif |
| **Test Steps** | 1. Mulai asesmen<br>2. Sengaja gerakkan mouse keluar window<br>3. Kembali ke asesmen<br>4. Ulangi beberapa kali |
| **Test Data** | - |
| **Expected Result** | - Warning popup muncul<br>- Counter pelanggaran bertambah<br>- Log aktivitas tercatat<br>- Tidak auto-submit kecuali batas terlampaui |
| **Priority** | High |

### TC-SIS-009: Akses Asesmen Setelah Deadline
| Test Case ID | TC-SIS-009 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa tidak dapat akses asesmen yang sudah melewati deadline |
| **Precondition** | - Asesmen sudah melewati deadline<br>- Siswa belum mengerjakan |
| **Test Steps** | 1. Coba akses asesmen yang expired<br>2. Klik tombol mulai asesmen |
| **Test Data** | Asesmen dengan deadline kemarin |
| **Expected Result** | - Pesan "Asesmen sudah ditutup"<br>- Tombol start disabled<br>- Hanya bisa lihat soal (jika allowed)<br>- No submission possible |
| **Priority** | Medium |

---

## 3. Proyek PjBL

### TC-SIS-010: View Tahapan Proyek
| Test Case ID | TC-SIS-010 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat dan memahami tahapan proyek |
| **Precondition** | - Siswa sudah login<br>- Proyek sudah dibuat guru<br>- Siswa sudah dalam kelompok |
| **Test Steps** | 1. Masuk ke section "Proyek"<br>2. Klik tahapan proyek<br>3. Baca instruksi detail<br>4. Download file panduan (jika ada) |
| **Test Data** | Tahap: "Analisis Kebutuhan System" |
| **Expected Result** | - Instruksi terlihat jelas<br>- Deadline countdown berfungsi<br>- File panduan dapat didownload<br>- Progress bar tahapan terlihat |
| **Priority** | High |

### TC-SIS-011: Submit Proyek Kelompok
| Test Case ID | TC-SIS-011 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat submit proyek atas nama kelompok |
| **Precondition** | - Siswa dalam kelompok<br>- Tahapan proyek tersedia<br>- Belum ada submission |
| **Test Steps** | 1. Masuk ke tahapan proyek<br>2. Klik "Submit Proyek"<br>3. Upload file atau masukkan link<br>4. Isi deskripsi submission<br>5. Submit proyek |
| **Test Data** | File: "analisis_kebutuhan.pdf"<br>Deskripsi: "Hasil analisis sistem perpustakaan" |
| **Expected Result** | - Upload berhasil<br>- Submission tersimpan untuk kelompok<br>- Semua anggota kelompok melihat submission<br>- Status berubah ke "submitted" |
| **Priority** | High |

### TC-SIS-012: Edit Submission Proyek
| Test Case ID | TC-SIS-012 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengedit submission proyek sebelum deadline |
| **Precondition** | - Proyek sudah di-submit<br>- Belum melewati deadline<br>- Masih dalam kelompok |
| **Test Steps** | 1. Masuk ke proyek submission<br>2. Klik "Edit Submission"<br>3. Ganti file dan update deskripsi<br>4. Save changes |
| **Test Data** | File baru: "analisis_kebutuhan_v2.pdf" |
| **Expected Result** | - Edit berhasil tersimpan<br>- File lama terganti<br>- History submission tercatat<br>- Timestamp update terekam |
| **Priority** | Medium |

### TC-SIS-013: Lihat Nilai Proyek
| Test Case ID | TC-SIS-013 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat nilai proyek yang sudah dinilai guru |
| **Precondition** | - Proyek sudah di-submit<br>- Guru sudah memberikan nilai |
| **Test Steps** | 1. Masuk ke section "Proyek"<br>2. Lihat status tahapan<br>3. Klik "Lihat Nilai"<br>4. Baca feedback guru |
| **Test Data** | - |
| **Expected Result** | - Nilai tampil jelas<br>- Feedback guru terlihat<br>- Semua anggota kelompok dapat melihat<br>- Rubrik penilaian (jika ada) |
| **Priority** | Medium |

---

## 4. Logbook Aktivitas

### TC-SIS-014: Isi Logbook Harian
| Test Case ID | TC-SIS-014 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengisi logbook aktivitas harian |
| **Precondition** | - Siswa sudah login |
| **Test Steps** | 1. Masuk ke menu "Logbook"<br>2. Klik "Tambah Entry"<br>3. Pilih tanggal<br>4. Isi aktivitas dan kendala<br>5. Upload file lampiran (optional)<br>6. Simpan entry |
| **Test Data** | Aktivitas: "Membuat flowchart sistem"<br>Kendala: "Sulit memahami alur data"<br>File: "flowchart_draft.png" |
| **Expected Result** | - Entry tersimpan dengan timestamp<br>- File terupload dengan benar<br>- Muncul di riwayat logbook<br>- Dapat diedit dalam waktu tertentu |
| **Priority** | Medium |

### TC-SIS-015: Edit Logbook Entry
| Test Case ID | TC-SIS-015 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat mengedit entry logbook |
| **Precondition** | - Logbook entry sudah ada<br>- Dalam periode edit yang diizinkan |
| **Test Steps** | 1. Pilih logbook entry<br>2. Klik "Edit"<br>3. Ubah konten aktivitas<br>4. Ganti file lampiran<br>5. Save perubahan |
| **Test Data** | Konten baru + file update |
| **Expected Result** | - Perubahan tersimpan<br>- Mark "edited" muncul<br>- History perubahan terjaga<br>- New timestamp untuk edit |
| **Priority** | Low |

### TC-SIS-016: View Riwayat Logbook
| Test Case ID | TC-SIS-016 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat riwayat logbook dengan filter |
| **Precondition** | - Siswa memiliki beberapa logbook entry |
| **Test Steps** | 1. Masuk ke "Riwayat Logbook"<br>2. Set filter tanggal<br>3. Search berdasarkan aktivitas<br>4. Sort berdasarkan tanggal |
| **Test Data** | Filter: 1 bulan terakhir |
| **Expected Result** | - Semua entry tampil sesuai filter<br>- Search function bekerja<br>- Sorting berfungsi<br>- Pagination jika data banyak |
| **Priority** | Low |

---

## 5. Online Compiler

### TC-SIS-017: Compile Code Java Valid
| Test Case ID | TC-SIS-017 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat menjalankan code Java yang valid |
| **Precondition** | - Siswa sudah login<br>- Akses ke online compiler |
| **Test Steps** | 1. Masuk ke "Online Compiler"<br>2. Tulis code Java sederhana<br>3. Klik "Run"<br>4. Lihat output result |
| **Test Data** | Code: `public class Hello { public static void main(String[] args) { System.out.println("Hello World"); } }` |
| **Expected Result** | - Compilation berhasil<br>- Output "Hello World" tampil<br>- No error messages<br>- Response time < 5 detik |
| **Priority** | High |

### TC-SIS-018: Handle Syntax Error
| Test Case ID | TC-SIS-018 |
|--------------|------------|
| **Test Objective** | Memverifikasi compiler menangani syntax error dengan baik |
| **Precondition** | - Siswa di online compiler |
| **Test Steps** | 1. Tulis code Java dengan syntax error<br>2. Klik "Run"<br>3. Lihat error message |
| **Test Data** | Code dengan missing semicolon |
| **Expected Result** | - Error message jelas<br>- Line number error ditunjukkan<br>- Helpful error description<br>- No system crash |
| **Priority** | High |

### TC-SIS-019: Handle Runtime Error/Timeout
| Test Case ID | TC-SIS-019 |
|--------------|------------|
| **Test Objective** | Memverifikasi compiler menangani infinite loop dan timeout |
| **Precondition** | - Siswa di online compiler |
| **Test Steps** | 1. Tulis code dengan infinite loop<br>2. Klik "Run"<br>3. Tunggu timeout |
| **Test Data** | Code: `while(true) { System.out.println("loop"); }` |
| **Expected Result** | - Execution terhenti setelah timeout<br>- Message "Execution timeout"<br>- System tetap responsive<br>- Memory tidak bocor |
| **Priority** | High |

---

## 6. Forum Diskusi

### TC-SIS-020: Akses Forum Setelah Asesmen
| Test Case ID | TC-SIS-020 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat akses forum setelah menyelesaikan asesmen |
| **Precondition** | - Siswa sudah menyelesaikan asesmen<br>- Forum diskusi tersedia |
| **Test Steps** | 1. Selesaikan asesmen<br>2. Klik "Forum Diskusi"<br>3. Lihat diskusi yang ada<br>4. Buat diskusi baru |
| **Test Data** | Topic: "Kesulitan soal nomor 5" |
| **Expected Result** | - Forum dapat diakses<br>- Dapat membuat diskusi baru<br>- Badge "Siswa" muncul<br>- Diskusi tersimpan |
| **Priority** | Medium |

### TC-SIS-021: Forum Terkunci Sebelum Asesmen
| Test Case ID | TC-SIS-021 |
|--------------|------------|
| **Test Objective** | Memverifikasi forum terkunci untuk siswa yang belum mengerjakan asesmen |
| **Precondition** | - Siswa belum mengerjakan asesmen<br>- Forum diskusi ada |
| **Test Steps** | 1. Coba akses forum diskusi<br>2. Lihat status akses |
| **Test Data** | - |
| **Expected Result** | - Pesan "Forum Terkunci"<br>- Instruksi selesaikan asesmen dulu<br>- No access ke konten forum<br>- Link ke asesmen tersedia |
| **Priority** | Medium |

### TC-SIS-022: Reply Diskusi Forum
| Test Case ID | TC-SIS-022 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat membalas diskusi di forum |
| **Precondition** | - Siswa sudah akses forum<br>- Ada diskusi yang bisa dibalas |
| **Test Steps** | 1. Masuk ke forum<br>2. Pilih diskusi yang ada<br>3. Tulis balasan<br>4. Submit reply |
| **Test Data** | Reply: "Saya juga mengalami kesulitan yang sama" |
| **Expected Result** | - Reply tersimpan<br>- Muncul dengan badge "Siswa"<br>- Thread discussion update<br>- Notifikasi ke peserta lain |
| **Priority** | Low |

---

## 7. Dashboard dan Schedule

### TC-SIS-023: View Personal Dashboard
| Test Case ID | TC-SIS-023 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat dashboard personal dengan informasi lengkap |
| **Precondition** | - Siswa sudah login<br>- Memiliki aktivitas di sistem |
| **Test Steps** | 1. Login siswa<br>2. Lihat dashboard utama<br>3. Check semua widget informasi |
| **Test Data** | - |
| **Expected Result** | - Nilai terbaru tampil<br>- Tugas pending terlihat<br>- Jadwal upcoming clear<br>- Progress course visible |
| **Priority** | Medium |

### TC-SIS-024: View Jadwal Personal
| Test Case ID | TC-SIS-024 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa dapat melihat jadwal personal mereka |
| **Precondition** | - Siswa sudah login<br>- Jadwal kelas sudah dibuat |
| **Test Steps** | 1. Masuk ke menu "Jadwal"<br>2. Lihat kalender personal<br>3. Klik detail jadwal<br>4. Check reminder/notification |
| **Test Data** | - |
| **Expected Result** | - Hanya jadwal kelas yang diikuti<br>- Detail jadwal lengkap<br>- Kalender view user-friendly<br>- Reminder berfungsi |
| **Priority** | Low |

---

## Negative Test Cases

### TC-SIS-NEG-001: Upload File Besar di Logbook
| Test Case ID | TC-SIS-NEG-001 |
|--------------|------------|
| **Test Objective** | Memverifikasi handling upload file yang terlalu besar |
| **Test Steps** | 1. Isi logbook dengan file >5MB<br>2. Submit form |
| **Test Data** | File 8MB |
| **Expected Result** | - Upload ditolak<br>- Error message jelas<br>- Form tidak corrupt |

### TC-SIS-NEG-002: Compile Code Malicious
| Test Case ID | TC-SIS-NEG-002 |
|--------------|------------|
| **Test Objective** | Memverifikasi compiler menolak code berbahaya |
| **Test Steps** | 1. Tulis code yang mencoba akses file system<br>2. Run code |
| **Test Data** | Code dengan file access |
| **Expected Result** | - Security restriction active<br>- Code tidak berjalan<br>- Clear error message |

### TC-SIS-NEG-003: Submit Proyek Setelah Deadline
| Test Case ID | TC-SIS-NEG-003 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa tidak dapat submit setelah deadline |
| **Test Steps** | 1. Coba submit proyek setelah deadline<br>2. Coba edit submission lama |
| **Expected Result** | - Submit button disabled<br>- Clear deadline message<br>- No edit permission |

---

## Mobile Responsiveness Tests

### TC-SIS-MOB-001: Mobile Dashboard
| Test Case ID | TC-SIS-MOB-001 |
|--------------|------------|
| **Test Objective** | Memverifikasi dashboard responsive di mobile |
| **Test Steps** | 1. Akses LMS dari mobile browser<br>2. Login sebagai siswa<br>3. Navigate dashboard |
| **Expected Result** | - Layout responsive<br>- Touch interaction smooth<br>- All features accessible |

### TC-SIS-MOB-002: Mobile Compiler
| Test Case ID | TC-SIS-MOB-002 |
|--------------|------------|
| **Test Objective** | Memverifikasi online compiler berfungsi di mobile |
| **Test Steps** | 1. Akses compiler di mobile<br>2. Tulis code<br>3. Run dan lihat output |
| **Expected Result** | - Code editor usable<br>- Virtual keyboard friendly<br>- Output readable |

---

## Checklist Execution

- [ ] Environment Setup Complete
- [ ] Test Data Prepared
- [ ] TC-SIS-001 through TC-SIS-024 Executed
- [ ] Negative Test Cases Executed
- [ ] Mobile Tests Executed
- [ ] Cross-browser Testing Done
- [ ] Performance Testing Done
- [ ] Security Validations Passed

## Test Summary Template

| Total Test Cases | Passed | Failed | Blocked | Pass Rate |
|------------------|--------|--------|---------|-----------|
| 27               |        |        |         |           |

**Critical Issues Found:**
- [ ] None
- [ ] List critical issues here

**User Experience Issues:**
- [ ] None
- [ ] List UX improvement areas

**Recommendations:**
- [ ] List improvement suggestions
