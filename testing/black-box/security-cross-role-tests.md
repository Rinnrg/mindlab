# Black Box Testing - Sistem Keamanan dan Lintas Role

## Deskripsi
Pengujian black box untuk sistem keamanan, autentikasi, autorisasi, dan skenario lintas role dalam sistem LMS. Testing ini memastikan integrity dan security sistem.

## Test Environment
- **Scope**: Cross-Role Security, Authentication, Authorization
- **Browser**: Chrome, Firefox, Edge, Safari
- **Device**: Desktop, Mobile
- **Network**: Normal, Slow, Offline scenarios

---

## 1. Sistem Autentikasi

### TC-SEC-001: Login Valid - Admin
| Test Case ID | TC-SEC-001 |
|--------------|------------|
| **Test Objective** | Memverifikasi login admin dengan kredensial yang benar |
| **Precondition** | - Akun admin sudah terdaftar<br>- Berada di halaman login |
| **Test Steps** | 1. Masukkan email admin yang valid<br>2. Masukkan password yang benar<br>3. Klik "Login"<br>4. Verifikasi redirect ke dashboard |
| **Test Data** | Email: "admin@lms.com"<br>Password: "AdminPass123!" |
| **Expected Result** | - Login berhasil<br>- Redirect ke dashboard admin<br>- Menu admin terlihat<br>- Session terbuat dengan benar |
| **Priority** | Critical |

### TC-SEC-002: Login Valid - Guru
| Test Case ID | TC-SEC-002 |
|--------------|------------|
| **Test Objective** | Memverifikasi login guru dengan kredensial yang benar |
| **Precondition** | - Akun guru sudah terdaftar<br>- Berada di halaman login |
| **Test Steps** | 1. Masukkan email guru yang valid<br>2. Masukkan password yang benar<br>3. Klik "Login"<br>4. Verifikasi dashboard dan permissions |
| **Test Data** | Email: "guru@lms.com"<br>Password: "GuruPass123!" |
| **Expected Result** | - Login berhasil<br>- Redirect ke dashboard guru<br>- Menu admin TIDAK terlihat<br>- Hanya akses fitur guru |
| **Priority** | Critical |

### TC-SEC-003: Login Valid - Siswa
| Test Case ID | TC-SEC-003 |
|--------------|------------|
| **Test Objective** | Memverifikasi login siswa dengan kredensial yang benar |
| **Precondition** | - Akun siswa sudah terdaftar<br>- Berada di halaman login |
| **Test Steps** | 1. Masukkan email siswa yang valid<br>2. Masukkan password yang benar<br>3. Klik "Login"<br>4. Verifikasi dashboard dan restrictions |
| **Test Data** | Email: "siswa@lms.com"<br>Password: "SiswaPass123!" |
| **Expected Result** | - Login berhasil<br>- Redirect ke dashboard siswa<br>- Menu admin dan guru TIDAK terlihat<br>- Hanya akses course enrolled |
| **Priority** | Critical |

### TC-SEC-004: Login Invalid - Kredensial Salah
| Test Case ID | TC-SEC-004 |
|--------------|------------|
| **Test Objective** | Memverifikasi penolakan login dengan kredensial yang salah |
| **Precondition** | - Berada di halaman login |
| **Test Steps** | 1. Masukkan email yang salah<br>2. Masukkan password yang salah<br>3. Klik "Login"<br>4. Verifikasi error handling |
| **Test Data** | Email: "wrong@email.com"<br>Password: "wrongpassword" |
| **Expected Result** | - Login ditolak<br>- Error message "Email atau password salah"<br>- Tetap di halaman login<br>- No session dibuat |
| **Priority** | High |

### TC-SEC-005: Logout Sistem
| Test Case ID | TC-SEC-005 |
|--------------|------------|
| **Test Objective** | Memverifikasi logout berfungsi dengan benar untuk semua role |
| **Precondition** | - User sudah login (admin/guru/siswa) |
| **Test Steps** | 1. Klik tombol "Logout"<br>2. Konfirmasi logout (jika ada)<br>3. Coba akses halaman protected<br>4. Verifikasi session destruction |
| **Test Data** | - |
| **Expected Result** | - Session dihapus<br>- Redirect ke halaman login<br>- Cannot access protected pages<br>- Clear browser session data |
| **Priority** | High |

---

## 2. Middleware Protection

### TC-SEC-006: Akses Protected Page Tanpa Login
| Test Case ID | TC-SEC-006 |
|--------------|------------|
| **Test Objective** | Memverifikasi middleware redirect untuk halaman protected |
| **Precondition** | - User belum login<br>- Browser clear session |
| **Test Steps** | 1. Akses URL dashboard langsung<br>2. Akses URL course langsung<br>3. Akses URL admin langsung |
| **Test Data** | URLs: "/dashboard", "/courses/123", "/admin/users" |
| **Expected Result** | - Semua request di-redirect ke "/login"<br>- No access ke content<br>- Middleware berfungsi konsisten |
| **Priority** | Critical |

### TC-SEC-007: Session Timeout Handling
| Test Case ID | TC-SEC-007 |
|--------------|------------|
| **Test Objective** | Memverifikasi handling session yang expired |
| **Precondition** | - User sudah login<br>- Session timeout diset (untuk testing) |
| **Test Steps** | 1. Login ke sistem<br>2. Biarkan session timeout<br>3. Coba akses halaman dalam sistem<br>4. Verifikasi auto-logout |
| **Test Data** | Session timeout: 30 menit (atau 5 menit untuk test) |
| **Expected Result** | - Auto-logout setelah timeout<br>- Redirect ke login dengan message<br>- Session data cleared |
| **Priority** | Medium |

---

## 3. Role-Based Access Control (RBAC)

### TC-SEC-008: Admin Access Verification
| Test Case ID | TC-SEC-008 |
|--------------|------------|
| **Test Objective** | Memverifikasi admin memiliki akses penuh ke semua fitur |
| **Precondition** | - Login sebagai admin |
| **Test Steps** | 1. Coba akses semua menu admin<br>2. Coba akses fitur guru<br>3. Coba akses fitur siswa<br>4. Verifikasi CRUD permissions |
| **Test Data** | - |
| **Expected Result** | - Full access ke semua fitur<br>- Dapat create/edit/delete users<br>- Dapat manage classes<br>- No access restrictions |
| **Priority** | High |

### TC-SEC-009: Guru Access Restriction
| Test Case ID | TC-SEC-009 |
|--------------|------------|
| **Test Objective** | Memverifikasi guru tidak dapat akses fitur admin |
| **Precondition** | - Login sebagai guru |
| **Test Steps** | 1. Coba akses URL admin langsung<br>2. Coba akses user management<br>3. Coba akses class management<br>4. Verifikasi error responses |
| **Test Data** | URLs: "/admin/*", "/users/manage", "/classes/create" |
| **Expected Result** | - HTTP 403 Forbidden<br>- Error page atau redirect<br>- No admin features visible<br>- Consistent access denial |
| **Priority** | High |

### TC-SEC-010: Siswa Access Restriction
| Test Case ID | TC-SEC-010 |
|--------------|------------|
| **Test Objective** | Memverifikasi siswa hanya dapat akses course yang di-enroll |
| **Precondition** | - Login sebagai siswa<br>- Enrolled di course A, tidak di course B |
| **Test Steps** | 1. Coba akses course A (enrolled)<br>2. Coba akses course B (not enrolled)<br>3. Coba akses admin/guru URLs<br>4. Verifikasi restrictions |
| **Test Data** | Course A ID: 123<br>Course B ID: 456 |
| **Expected Result** | - Can access course A<br>- Cannot access course B<br>- No admin/guru features<br>- Proper error messages |
| **Priority** | High |

### TC-SEC-011: Cross-Role URL Manipulation
| Test Case ID | TC-SEC-011 |
|--------------|------------|
| **Test Objective** | Memverifikasi tidak ada akses melalui URL manipulation |
| **Precondition** | - Login sebagai guru |
| **Test Steps** | 1. Coba ganti URL ke admin endpoints<br>2. Coba akses API admin langsung<br>3. Coba parameter injection<br>4. Test dengan berbagai methods |
| **Test Data** | Various admin URLs and API endpoints |
| **Expected Result** | - Semua unauthorized access ditolak<br>- Proper HTTP status codes<br>- No data leakage<br>- Security headers present |
| **Priority** | Critical |

---

## 4. Data Security & Privacy

### TC-SEC-012: File Access Security
| Test Case ID | TC-SEC-012 |
|--------------|------------|
| **Test Objective** | Memverifikasi keamanan akses file upload |
| **Precondition** | - File sudah di-upload oleh guru<br>- User dengan berbagai role |
| **Test Steps** | 1. Login sebagai siswa enrolled<br>2. Akses file materi<br>3. Login sebagai siswa not enrolled<br>4. Coba akses file yang sama<br>5. Test direct URL access |
| **Test Data** | File URLs from different courses |
| **Expected Result** | - Enrolled student dapat akses<br>- Non-enrolled student ditolak<br>- Direct URL protected<br>- Token validation berfungsi |
| **Priority** | High |

### TC-SEC-013: Data Isolation Between Classes
| Test Case ID | TC-SEC-013 |
|--------------|------------|
| **Test Objective** | Memverifikasi isolasi data antar kelas |
| **Precondition** | - Guru A mengajar kelas 1<br>- Guru B mengajar kelas 2 |
| **Test Steps** | 1. Login sebagai Guru A<br>2. Coba akses data kelas 2<br>3. Coba edit course kelas 2<br>4. Verifikasi data boundaries |
| **Test Data** | - |
| **Expected Result** | - Guru hanya lihat kelas sendiri<br>- Cannot access other class data<br>- CRUD restricted to own classes<br>- No data bleeding |
| **Priority** | High |

### TC-SEC-014: Sensitive Information Protection
| Test Case ID | TC-SEC-014 |
|--------------|------------|
| **Test Objective** | Memverifikasi proteksi informasi sensitif |
| **Precondition** | - Sistem memiliki data user |
| **Test Steps** | 1. Check password di database<br>2. Check API responses<br>3. Check browser developer tools<br>4. Check log files |
| **Test Data** | - |
| **Expected Result** | - Password ter-hash di database<br>- No password di API response<br>- No sensitive data di client-side<br>- Logs tidak contain credentials |
| **Priority** | Critical |

---

## 5. SQL Injection & XSS Protection

### TC-SEC-015: SQL Injection Testing
| Test Case ID | TC-SEC-015 |
|--------------|------------|
| **Test Objective** | Memverifikasi proteksi terhadap SQL injection |
| **Precondition** | - Akses ke form input |
| **Test Steps** | 1. Test login form dengan SQL injection<br>2. Test search dengan malicious input<br>3. Test form submission dengan SQL payload<br>4. Verifikasi database integrity |
| **Test Data** | Payloads: `' OR '1'='1`, `'; DROP TABLE users; --`, etc. |
| **Expected Result** | - Input di-sanitize<br>- Parameterized queries berfungsi<br>- No database manipulation<br>- Proper error handling |
| **Priority** | Critical |

### TC-SEC-016: XSS Attack Prevention
| Test Case ID | TC-SEC-016 |
|--------------|------------|
| **Test Objective** | Memverifikasi proteksi terhadap XSS attacks |
| **Precondition** | - Akses ke form input/text areas |
| **Test Steps** | 1. Input script tags di form<br>2. Test dengan JavaScript payloads<br>3. Test file upload dengan HTML<br>4. Check output rendering |
| **Test Data** | Payloads: `<script>alert('XSS')</script>`, `<img src=x onerror=alert(1)>` |
| **Expected Result** | - Script tags di-escape<br>- No JavaScript execution<br>- Content properly sanitized<br>- CSP headers active |
| **Priority** | Critical |

### TC-SEC-017: CSRF Protection
| Test Case ID | TC-SEC-017 |
|--------------|------------|
| **Test Objective** | Memverifikasi proteksi terhadap CSRF attacks |
| **Precondition** | - User logged in |
| **Test Steps** | 1. Submit form tanpa CSRF token<br>2. Submit dengan invalid token<br>3. Test cross-origin requests<br>4. Verify token validation |
| **Test Data** | - |
| **Expected Result** | - Requests tanpa token ditolak<br>- Invalid tokens rejected<br>- Proper CSRF middleware<br>- Token refresh on forms |
| **Priority** | High |

---

## 6. Session Management

### TC-SEC-018: Concurrent Sessions
| Test Case ID | TC-SEC-018 |
|--------------|------------|
| **Test Objective** | Memverifikasi handling multiple sessions |
| **Precondition** | - User account tersedia |
| **Test Steps** | 1. Login dari browser Chrome<br>2. Login dari browser Firefox<br>3. Logout dari satu browser<br>4. Check session di browser lain |
| **Test Data** | Same user, different browsers |
| **Expected Result** | - Both sessions valid<br>- Logout affects all sessions<br>- Proper session sharing<br>- Security maintained |
| **Priority** | Medium |

### TC-SEC-019: Session Hijacking Prevention
| Test Case ID | TC-SEC-019 |
|--------------|------------|
| **Test Objective** | Memverifikasi proteksi terhadap session hijacking |
| **Precondition** | - User logged in |
| **Test Steps** | 1. Check session cookie attributes<br>2. Test over HTTP vs HTTPS<br>3. Check cookie security flags<br>4. Test session regeneration |
| **Test Data** | - |
| **Expected Result** | - Cookies dengan HttpOnly flag<br>- Secure flag untuk HTTPS<br>- Session regeneration on login<br>- SameSite attributes set |
| **Priority** | High |

---

## 7. Network Security

### TC-SEC-020: HTTPS Enforcement
| Test Case ID | TC-SEC-020 |
|--------------|------------|
| **Test Objective** | Memverifikasi enforcement HTTPS |
| **Precondition** | - Sistem deployed dengan SSL |
| **Test Steps** | 1. Akses via HTTP<br>2. Check automatic redirect<br>3. Verify certificate<br>4. Test mixed content |
| **Test Data** | - |
| **Expected Result** | - HTTP redirect ke HTTPS<br>- Valid SSL certificate<br>- No mixed content warnings<br>- HSTS headers present |
| **Priority** | High |

### TC-SEC-021: Rate Limiting
| Test Case ID | TC-SEC-021 |
|--------------|------------|
| **Test Objective** | Memverifikasi rate limiting pada API dan form |
| **Precondition** | - Rate limiting configured |
| **Test Steps** | 1. Submit login berkali-kali rapid<br>2. Test API calls dengan high frequency<br>3. Check blocking mechanism<br>4. Test recovery after limit |
| **Test Data** | - |
| **Expected Result** | - Requests diblock setelah threshold<br>- Proper HTTP 429 status<br>- Temporary blocking<br>- Recovery mechanism |
| **Priority** | Medium |

---

## 8. Input Validation & Sanitization

### TC-SEC-022: File Upload Security
| Test Case ID | TC-SEC-022 |
|--------------|------------|
| **Test Objective** | Memverifikasi keamanan file upload |
| **Precondition** | - Akses ke file upload feature |
| **Test Steps** | 1. Upload file dengan ekstensi tidak diizinkan<br>2. Upload file dengan nama panjang/karakter khusus<br>3. Upload file oversized<br>4. Upload file dengan content malicious |
| **Test Data** | Files: .exe, .php, large files, renamed malicious files |
| **Expected Result** | - Restricted extensions ditolak<br>- File size limits enforced<br>- Content-type validation<br>- Safe file storage |
| **Priority** | High |

### TC-SEC-023: Input Length Validation
| Test Case ID | TC-SEC-023 |
|--------------|------------|
| **Test Objective** | Memverifikasi validasi panjang input |
| **Precondition** | - Akses ke form inputs |
| **Test Steps** | 1. Input text sangat panjang<br>2. Test dengan buffer overflow attempts<br>3. Check database field limits<br>4. Verify error handling |
| **Test Data** | Strings: 1000+ characters, special patterns |
| **Expected Result** | - Length limits enforced<br>- Proper truncation/rejection<br>- No buffer overflow<br>- Clear error messages |
| **Priority** | Medium |

---

## 9. Error Handling & Information Disclosure

### TC-SEC-024: Error Information Leakage
| Test Case ID | TC-SEC-024 |
|--------------|------------|
| **Test Objective** | Memverifikasi tidak ada information leakage di error messages |
| **Precondition** | - |
| **Test Steps** | 1. Cause various error conditions<br>2. Check error messages<br>3. Test with invalid inputs<br>4. Check stack traces |
| **Test Data** | Invalid database queries, file access, etc. |
| **Expected Result** | - Generic error messages<br>- No stack traces exposed<br>- No database schema info<br>- No system path disclosure |
| **Priority** | Medium |

### TC-SEC-025: Security Headers
| Test Case ID | TC-SEC-025 |
|--------------|------------|
| **Test Objective** | Memverifikasi implementasi security headers |
| **Precondition** | - |
| **Test Steps** | 1. Check HTTP response headers<br>2. Verify CSP implementation<br>3. Check HSTS headers<br>4. Test X-Frame-Options |
| **Test Data** | - |
| **Expected Result** | - CSP headers configured<br>- HSTS implemented<br>- X-Frame-Options set<br>- X-Content-Type-Options present |
| **Priority** | Low |

---

## 10. Compliance & Audit

### TC-SEC-026: Activity Logging
| Test Case ID | TC-SEC-026 |
|--------------|------------|
| **Test Objective** | Memverifikasi logging aktivitas security |
| **Precondition** | - Logging system active |
| **Test Steps** | 1. Perform login/logout<br>2. Attempt unauthorized access<br>3. Upload files<br>4. Check log entries |
| **Test Data** | - |
| **Expected Result** | - All security events logged<br>- Proper log format<br>- Timestamp accuracy<br>- User identification clear |
| **Priority** | Low |

---

## Critical Security Test Checklist

### Authentication & Authorization
- [ ] Valid login for all roles works
- [ ] Invalid login properly rejected
- [ ] Role-based access enforced
- [ ] Session management secure
- [ ] Logout functionality complete

### Input Validation
- [ ] SQL injection protected
- [ ] XSS attacks prevented
- [ ] File upload secure
- [ ] Input length validation
- [ ] CSRF protection active

### Data Security
- [ ] Data isolation between users/classes
- [ ] Sensitive data protected
- [ ] File access controlled
- [ ] Database security maintained

### Network Security
- [ ] HTTPS enforced
- [ ] Security headers implemented
- [ ] Rate limiting functional
- [ ] Error handling secure

## Test Summary Template

| Total Test Cases | Passed | Failed | Critical Issues | Pass Rate |
|------------------|--------|---------|-----------------|-----------|
| 26               |        |        |                 |           |

**Critical Security Issues:**
- [ ] None found
- [ ] List any critical vulnerabilities

**Medium/Low Priority Issues:**
- [ ] None found
- [ ] List improvement areas

**Compliance Status:**
- [ ] OWASP Top 10 addressed
- [ ] Security best practices followed
- [ ] Regular security review scheduled
