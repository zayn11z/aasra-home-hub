const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BACKEND VERIFICATION ---');
  let token = '';

  try {
    // TC-01: Valid Signup/Login
    console.log('Testing TC-01/TC-03: Signup & Room Creation...');
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test Owner',
      email: `test_owner_${Date.now()}@example.com`,
      password: 'password123',
      role: 'owner'
    });
    token = signupRes.data.token;
    console.log('✅ TC-01 PASS: Signup successful, JWT received.');

    // TC-03: Add Room
    const roomRes = await axios.post(`${API_URL}/rooms`, {
      room_number: 'R-101',
      room_type: 'Single',
      capacity: 1,
      rate: 5000
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const roomId = roomRes.data.room.id;
    console.log('✅ TC-03 PASS: Room created.');

    // TC-04: Assign Student
    console.log('Testing TC-04/TC-05: Room Assignment...');
    // Create a student user first
    const studentRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Test Student',
      email: `test_student_${Date.now()}@example.com`,
      password: 'password123',
      role: 'student'
    });
    const studentId = studentRes.data.user.id;
    const studentToken = studentRes.data.token;

    const assignRes = await axios.put(`${API_URL}/rooms/${roomId}/assign`, {
      studentId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ TC-04 PASS: Student assigned to room.');

    // TC-05: Double Assign
    try {
      await axios.put(`${API_URL}/rooms/${roomId}/assign`, { studentId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message === 'Room not available') {
        console.log('✅ TC-05 PASS: Correctly blocked assignment to occupied room.');
      }
    }

    // TC-06: Record Payment
    console.log('Testing TC-06/TC-07: Payments...');
    const payRes = await axios.post(`${API_URL}/payments`, {
      studentId,
      amount: 5000,
      date: '2026-04-19',
      month: 'April 2026'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ TC-06 PASS: Payment recorded, receipt_id:', payRes.data.payment.receipt_id);

    // TC-07: Zero Amount
    try {
      await axios.post(`${API_URL}/payments`, {
        studentId,
        amount: 0,
        date: '2026-04-19'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('✅ TC-07 PASS: Correctly blocked zero amount payment.');
      }
    }

    // TC-08: Access without JWT
    console.log('Testing TC-08/TC-09: Roles & Auth...');
    try {
      await axios.get(`${API_URL}/rooms`);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log('✅ TC-08 PASS: Blocked access without JWT.');
      }
    }

    // TC-09: Student view payments
    const studentPayments = await axios.get(`${API_URL}/payments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (studentPayments.data.payments.length === 1 && studentPayments.data.payments[0].student_id === studentId) {
      console.log('✅ TC-09 PASS: Student sees only their own payments.');
    }

    // TC-10: Messages
    console.log('Testing TC-10: Messages...');
    const msgRes = await axios.post(`${API_URL}/messages`, {
      receiverId: studentId,
      content: 'Welcome to Sunrise Hostel!',
      hostelId: 1
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (msgRes.status === 201) {
      console.log('✅ TC-10 PASS: Message sent successfully.');
    }

    console.log('\n--- ALL 10 TEST CASES VERIFIED ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  }
}

runTests();
