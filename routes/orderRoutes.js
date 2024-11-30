// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const {  createOrder,getOrders, getPaymentsSummary, getUserOrders, getSingleOrderDetail } = require('../controllers/orderControllers');
const { verifyToken } = require('../middleware/jwt');

const upload = multer({ storage });

const router = express.Router();

router.post('/',verifyToken,createOrder );
router.get('/',getOrders );
router.get("/:id",verifyToken,getUserOrders);
router.get("/single/:id",verifyToken,getSingleOrderDetail);
router.get('/payments/summary', getPaymentsSummary);


module.exports = router;
