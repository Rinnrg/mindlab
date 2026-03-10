// Test script untuk menguji API delete course
// Jalankan dengan: node test-course-delete.js

async function testCourseDelete() {
  const BASE_URL = 'http://localhost:3000';
  
  try {
    console.log('Testing course deletion API...');
    
    // Test dengan course ID yang tidak ada
    console.log('\n1. Testing dengan course ID yang tidak ada...');
    const response1 = await fetch(`${BASE_URL}/api/courses/non-existent-id`, {
      method: 'DELETE'
    });
    
    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // Test dengan course ID yang valid (sesuaikan dengan data Anda)
    console.log('\n2. Testing dengan course ID yang valid...');
    console.log('Silakan ganti COURSE_ID_DISINI dengan ID course yang valid di database Anda');
    
    // Uncomment dan sesuaikan jika ingin test dengan course ID yang valid
    /*
    const COURSE_ID = 'COURSE_ID_DISINI'; // Ganti dengan course ID yang valid
    const response2 = await fetch(`${BASE_URL}/api/courses/${COURSE_ID}`, {
      method: 'DELETE'
    });
    
    console.log('Status:', response2.status);
    const result2 = await response2.json();
    console.log('Response:', result2);
    */
    
  } catch (error) {
    console.error('Error testing course deletion:', error);
  }
}

testCourseDelete();
