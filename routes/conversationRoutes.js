const express = require('express');
const router = express.Router();
const {
  createConverstion,
  getConverstion,
  getConverstions,
  updateConverstion,
} = require('../controllers/conversationController');
const { verifyToken } = require('../middleware/jwt');

// Proper HTTP methods
router.get("/",verifyToken, getConverstions);              // GET all conversations
router.post("/",verifyToken, createConverstion);           // POST to create a conversation
router.get("/single/:id",verifyToken, getConverstion);     // GET a single conversation by ID
router.put("/:id",verifyToken, updateConverstion);         // PUT to update a conversation by ID

module.exports = router;
