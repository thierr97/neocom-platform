const API_URL = 'https://neocom-backend.onrender.com/api/auth/login';

async function getToken() {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@neoserv.com',
      password: 'Admin123!'
    })
  });

  const data = await response.json();

  if (data.success && data.tokens) {
    console.log(data.tokens.accessToken);
  } else {
    console.error('Error:', data);
    process.exit(1);
  }
}

getToken();
