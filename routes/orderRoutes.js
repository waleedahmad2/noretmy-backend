// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const {  createOrder,getOrders,getOrder, getPaymentsSummary } = require('../controllers/orderControllers');
const { verifyToken } = require('../middleware/jwt');

const upload = multer({ storage });

const router = express.Router();

router.post('/',verifyToken,createOrder );
router.get('/',getOrders );
router.get("/:id",getOrder);
router.get('/payments/summary', getPaymentsSummary);


module.exports = router;
