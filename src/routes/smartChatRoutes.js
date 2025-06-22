const express = require('express');
const router = express.Router();
const smartChatController = require('../controllers/smartChatController');

// Smart chat endpoints
router.post('/chat', smartChatController.handleChat);
router.get('/analytics', smartChatController.getAnalytics);
router.get('/knowledge-stats', smartChatController.getKnowledgeStats);

module.exports = router; 