// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const {  
  createOrder,
  getOrders,
  getPaymentsSummary,
  getUserOrders,
  getSingleOrderDetail, 
  createOrderPaypal,
  captureOrder
} = require('../controllers/orderControllers');
const { verifyToken } = require('../middleware/jwt');

const upload = multer({ storage });
const router = express.Router();

/* ----------------- Order Routes ----------------- */
// Create a new order
router.post('/', verifyToken, createOrder);
router.post('/create-order/paypal', createOrderPaypal);
router.post('/capture-order', captureOrder);


// Get all orders (admin or system-level access)
router.get('/', getOrders);

// Get orders specific to a logged-in user
router.get('/userOrders', verifyToken, getUserOrders);

// Get details of a single order by ID
router.get('/single/:id', verifyToken, getSingleOrderDetail);

/* ---------------- Payments Summary ---------------- */
// Get payments summary for orders
router.get('/payments/summary', getPaymentsSummary);

module.exports = router;
