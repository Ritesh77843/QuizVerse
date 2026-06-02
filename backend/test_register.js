async function test() {
  try {
    const res = await fetch('http://localhost:8081/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        displayName: 'test_node_2',
        email: 'test_node_2@example.com',
        password: 'password123'
      })
    });
    const data = await res.json();
    console.log("STATUS:", res.status);
    console.log(data);
  } catch (error) {
    console.error("ERROR:", error.message);
  }
}
test();
