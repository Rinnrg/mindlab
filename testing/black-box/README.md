# Master Test Plan - Black Box Testing Sistem LMS

## Overview
Dokumen ini adalah master test plan untuk black box testing sistem Learning Management System (LMS) yang mencakup pengujian untuk semua role dan aspek sistem.

## Test Scope
Pengujian black box lengkap untuk sistem LMS meliputi:
- **Role-based testing**: Admin, Guru, Siswa
- **Security testing**: Authentication, Authorization, Data Protection
- **Performance testing**: Load times, Concurrent users, Responsiveness
- **Compatibility testing**: Cross-browser, Cross-device, Cross-platform

## Test Structure

### 1. Role-Based Testing Files
- **admin-role-tests.md**: Pengujian fitur khusus role Admin
- **guru-role-tests.md**: Pengujian fitur khusus role Guru  
- **siswa-role-tests.md**: Pengujian fitur khusus role Siswa

### 2. Security & Cross-Role Testing
- **security-cross-role-tests.md**: Pengujian keamanan dan interaksi lintas role

### 3. Non-Functional Testing
- **performance-compatibility-tests.md**: Pengujian performance dan compatibility

## Test Environment Requirements

### Hardware
- **Desktop**: Windows/Mac/Linux dengan minimum 8GB RAM
- **Mobile Devices**: iOS (iPhone/iPad), Android (Samsung/Google Pixel)
- **Network**: High-speed internet, 3G simulation capability

### Software
- **Browsers**: Chrome (latest), Firefox (latest), Edge (latest), Safari (latest)
- **Tools**: Browser DevTools, Network throttling, Screen readers
- **Database**: Access untuk data verification (optional)

### Test Data Requirements
- **Admin Account**: admin@lms.com / AdminPass123!
- **Guru Accounts**: guru1@lms.com, guru2@lms.com / GuruPass123!
- **Siswa Accounts**: siswa1@lms.com, siswa2@lms.com / SiswaPass123!
- **Test Files**: PDF (2MB), PPT (3MB), DOCX (5MB), Images (1MB)
- **Test Classes**: 3 kelas dengan different categories
- **Test Courses**: 5 courses dengan varied content types

## Test Execution Strategy

### Phase 1: Functional Testing (Week 1-2)
1. **Admin Role Testing** (3 days)
   - User management features
   - Class management features  
   - Enrollment management
   - Dashboard dan reporting

2. **Guru Role Testing** (3 days)
   - Course creation dan management
   - Materi upload dan edit
   - Assessment creation (MCQ, Essay)
   - Project management (PjBL)
   - Forum moderation

3. **Siswa Role Testing** (3 days)
   - Course access dan navigation
   - Assessment taking
   - Project submission
   - Forum participation
   - Online compiler usage

4. **Cross-Role Integration** (2 days)
   - Enrollment flow testing
   - Assignment workflow
   - Grade reporting flow
   - Forum discussion flow

### Phase 2: Security Testing (Week 3)
1. **Authentication Testing** (2 days)
   - Login/logout untuk semua roles
   - Session management
   - Password security

2. **Authorization Testing** (2 days)
   - Role-based access control
   - Data isolation
   - File access security

3. **Input Validation** (1 day)
   - SQL injection prevention
   - XSS protection
   - File upload security

4. **Security Compliance** (2 days)
   - HTTPS enforcement
   - Security headers
   - Error handling

### Phase 3: Performance & Compatibility (Week 4)
1. **Performance Testing** (3 days)
   - Page load times
   - File upload performance
   - Concurrent user testing
   - Database performance

2. **Browser Compatibility** (2 days)
   - Chrome, Firefox, Edge, Safari
   - Feature parity testing
   - UI consistency

3. **Device Responsiveness** (2 days)
   - Desktop (various resolutions)
   - Tablet responsiveness
   - Mobile responsiveness

## Test Case Prioritization

### Critical (Must Pass)
- Login/logout functionality
- Role-based access control
- Course enrollment flow
- Assessment submission
- File upload/download
- Basic CRUD operations

### High (Should Pass)  
- Advanced features within roles
- Performance benchmarks
- Security validations
- Cross-browser compatibility
- Mobile responsiveness

### Medium (Nice to Pass)
- Edge case handling
- Advanced performance scenarios
- Accessibility features
- Error message quality

### Low (Can be Deferred)
- UI polish items
- Advanced usability features
- Extreme edge cases
- Optional integrations

## Entry and Exit Criteria

### Entry Criteria
- [ ] Test environment fully setup
- [ ] All test data prepared
- [ ] Application deployed dan accessible
- [ ] Test accounts created dan verified
- [ ] Test files prepared
- [ ] Testing tools configured

### Exit Criteria
- [ ] All Critical test cases passed
- [ ] 95% of High priority test cases passed
- [ ] 80% of Medium priority test cases passed
- [ ] No Critical security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility achieved
- [ ] Mobile responsiveness verified

## Risk Assessment

### High Risk Areas
1. **File Upload Security**: Potential untuk malicious file upload
2. **Online Compiler**: Code execution security risks
3. **Role-Based Access**: Authorization bypass possibilities
4. **Session Management**: Session hijacking vulnerabilities
5. **Database Security**: SQL injection vulnerabilities

### Medium Risk Areas
1. **Performance Degradation**: Under high load conditions
2. **Browser Compatibility**: Inconsistent behavior across browsers
3. **Mobile Experience**: Limited functionality on mobile devices
4. **Data Integrity**: Race conditions dengan concurrent access

### Low Risk Areas  
1. **UI Inconsistencies**: Minor layout issues
2. **Usability Issues**: Learning curve untuk new users
3. **Error Message Quality**: Unclear error messages

## Defect Classification

### Severity Levels
- **Critical**: System crashes, security vulnerabilities, data loss
- **High**: Major functionality tidak bekerja, significant performance issues
- **Medium**: Minor functionality issues, usability problems
- **Low**: Cosmetic issues, minor UI inconsistencies

### Priority Levels
- **P0**: Fix immediately (Critical blocking issues)
- **P1**: Fix dalam current release cycle
- **P2**: Fix dalam next release
- **P3**: Fix when resources available

## Test Deliverables

### Test Execution Reports
- Daily test execution status
- Defect reports dengan screenshots
- Performance benchmark results
- Browser compatibility matrix
- Security assessment report

### Final Test Summary
- Overall test coverage report
- Pass/fail statistics by category
- Defect summary by severity/priority
- Performance benchmarks achieved
- Security compliance status
- Recommendations untuk improvements

## Test Schedule

| Week | Phase | Activities | Deliverables |
|------|--------|------------|-------------|
| 1-2 | Functional Testing | Role-based feature testing | Daily status reports, Defect logs |
| 3 | Security Testing | Security vulnerability assessment | Security test report |
| 4 | Performance & Compatibility | Performance dan cross-platform testing | Performance report, Compatibility matrix |
| 5 | Test Closure | Final reporting dan recommendations | Final test summary report |

## Tools and Resources

### Testing Tools
- **Browser DevTools**: Performance monitoring, Network throttling
- **Lighthouse**: Performance dan accessibility auditing  
- **Postman**: API testing (if applicable)
- **Screen Readers**: Accessibility testing
- **Load Testing Tools**: JMeter atau similar (untuk advanced performance testing)

### Documentation Tools
- **Markdown**: Test case documentation
- **Screenshots**: Visual bug reporting
- **Screen Recording**: Complex issue reproduction

## Contact Information

### Test Team
- **Test Lead**: [Name] - Overall test coordination
- **Security Tester**: [Name] - Security vulnerability assessment  
- **Performance Tester**: [Name] - Performance benchmarking
- **Compatibility Tester**: [Name] - Cross-browser/device testing

### Development Team Contacts
- **Project Manager**: [Name] - Issue escalation
- **Lead Developer**: [Name] - Technical consultations
- **DevOps Engineer**: [Name] - Environment issues

## Conclusion

Dokumen master test plan ini memberikan framework komprehensif untuk black box testing sistem LMS. Dengan mengikuti struktur dan methodology yang telah ditetapkan, tim testing dapat memastikan bahwa sistem LMS memenuhi semua requirements fungsional dan non-fungsional sebelum deployment.

Setiap file testing individual berisi detail test cases yang specific dan actionable. Regular review dan update dari test plan ini akan membantu maintain kualitas testing seiring dengan evolusi sistem.

---

**Document Version**: 1.0  
**Last Updated**: March 11, 2026  
**Next Review Date**: April 11, 2026
