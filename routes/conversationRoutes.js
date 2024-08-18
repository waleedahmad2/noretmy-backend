const express = require('express');
const router = express.Router();
const {
  createConverstion,
  getConverstion,
  getConverstions,
  updateConverstion,
} = require('../controllers/conversationController');

// Proper HTTP methods
router.get("/", getConverstions);              // GET all conversations
router.post("/", createConverstion);           // POST to create a conversation
router.get("/single/:id", getConverstion);     // GET a single conversation by ID
router.put("/:id", updateConverstion);         // PUT to update a conversation by ID

module.exports = router;
