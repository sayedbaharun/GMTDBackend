const express = require('express');
const app = express();
const port = 5000; // Replit expects this port

app.get('/', (req, res) => {
  res.send('Hello World! The test server is working.');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server listening at http://0.0.0.0:${port}`);
});