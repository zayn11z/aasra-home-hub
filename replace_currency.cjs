const fs = require('fs');
const files = [
  'src/pages/StudentRoom.tsx',
  'src/pages/PaymentTracking.tsx',
  'src/pages/OwnerRooms.tsx',
  'src/pages/OwnerPayments.tsx',
  'src/pages/OwnerDashboard.tsx',
  'src/pages/Hostels.tsx'
];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/₹/g, 'PKR ');
  fs.writeFileSync(f, content, 'utf8');
});
console.log("Currency updated.");
