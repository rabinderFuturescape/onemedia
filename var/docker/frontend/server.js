const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 4200;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'postiz-frontend',
    version: '1.0.0'
  });
});

// Login page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OneSSO Authentication Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        button { padding: 10px 20px; background-color: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer; }
        pre { background-color: #f1f1f1; padding: 10px; border-radius: 5px; overflow: auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>OneSSO Authentication Test</h1>
        <p>Click the button below to sign in with OneSSO:</p>
        <button onclick="login()">Sign in with OneSSO</button>
        <div id="result"></div>
      </div>
      <script>
        function login() {
          fetch("${process.env.NEXT_PUBLIC_ONESSO_URL}/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: "admin",
              password: "admin"
            })
          })
          .then(res => res.json())
          .then(data => {
            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = '<h2>Login Successful!</h2>' +
              '<h3>User Info:</h3>' +
              '<pre>' + JSON.stringify(data.user, null, 2) + '</pre>' +
              '<h3>Token:</h3>' +
              '<pre>' + data.access_token + '</pre>' +
              '<h2>Backend Health Check:</h2>' +
              '<div id="backendHealth">Loading...</div>';
            
            // Check backend health with the token
            return fetch("${process.env.NEXT_PUBLIC_BACKEND_URL}/health", {
              headers: {
                "Authorization": 'Bearer ' + data.access_token
              }
            });
          })
          .then(res => res.json())
          .then(data => {
            const backendHealthDiv = document.getElementById("backendHealth");
            backendHealthDiv.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          })
          .catch(err => {
            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = '<h2>Error</h2><pre>' + err.message + '</pre>';
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
});
