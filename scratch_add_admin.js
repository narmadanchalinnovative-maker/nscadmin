const email = "testnonexistent999@gmail.com";
const password = "12345678";

fetch('http://201.18.192.154:3001/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
})
.then(res => res.json())
.then(data => {
  console.log("Response:", data);
})
.catch(err => {
  console.error("Error:", err);
});
