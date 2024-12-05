const express = require("express");
const { handleStripeWebhook } = require("../controllers/PaymentController");
const router = express.Router();


router.get('/stripe', handleStripeWebhook);



module.exports=router
