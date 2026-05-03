const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING BOOKING FLOW VERIFICATION ---');
  let token = '';

  try {
    // 1. Signup new student
    console.log('1. Signing up new student...');
    const signupRes = await axios.post(`${API_URL}/auth/signup`, {
      name: 'Flow Student',
      email: `flow_student_${Date.now()}@example.com`,
      password: 'password123',
      role: 'student'
    });
    token = signupRes.data.token;
    console.log('✅ PASS: Signup successful');

    // 2. Verify my-room is empty (404)
    console.log('2. Verifying my-room is initially empty...');
    try {
      await axios.get(`${API_URL}/rooms/my-room`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ FAIL: my-room should be empty for new student');
      return;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log('✅ PASS: my-room returns 404 No room assigned');
      } else {
        throw err;
      }
    }

    // 3. Fetch all rooms
    console.log('3. Fetching available dummy rooms...');
    const roomsRes = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const rooms = roomsRes.data.rooms;
    if (rooms.length > 0 && rooms[0].hostel_name) {
      console.log(`✅ PASS: Found ${rooms.length} rooms, including a room at ${rooms[0].hostel_name}`);
    } else {
      console.log('❌ FAIL: Missing rooms or hostel_name');
      return;
    }
    const targetRoom = rooms[0];

    // 4. Book the room
    console.log(`4. Booking Room ${targetRoom.room_number}...`);
    const bookRes = await axios.post(`${API_URL}/payments/book`, {
      roomId: targetRoom.id,
      amount: targetRoom.rate,
      paymentMethod: 'card'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ PASS: Room booked successfully, Receipt:', bookRes.data.receipt_id);

    // 5. Verify room is assigned
    console.log('5. Verifying my-room returns the booked room...');
    const myRoomRes = await axios.get(`${API_URL}/rooms/my-room`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (myRoomRes.data.room.id === targetRoom.id) {
       console.log(`✅ PASS: my-room returned the assigned room: ${myRoomRes.data.room.room_number}`);
    } else {
       console.log('❌ FAIL: my-room mismatch!');
       return;
    }

    console.log('\n--- ALL BOOKING TESTS PASSED ---');
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  }
}

runTests();
