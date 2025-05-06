const express = require('express');
const path = require('path');
const app = express();
const port = 7000; // Changed from 5000 to avoid conflict with Express API Server

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Simple API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Start the server
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Web app server running on http://0.0.0.0:${port}`);
});

// Keep the process running
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server shutdown');
    process.exit(0);
  });
});

// Log to keep track of server status
setInterval(() => {
  console.log(`Server still running on http://0.0.0.0:${port}`);
}, 60000); // Log every minute