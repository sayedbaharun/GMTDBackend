const express = require('express');
const path = require('path');
const app = express();
const port = parseInt(process.env.PORT || 5000);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// UI routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sales.html'));
});

app.get('/simple-sales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-sales.html'));
});

app.get('/user-requests', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user-requests.html'));
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Feedback server running on http://0.0.0.0:${port}`);
});