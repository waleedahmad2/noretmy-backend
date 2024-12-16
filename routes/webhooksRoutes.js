const express = require("express");
const { handleStripeWebhook } = require("../controllers/PaymentController");
// const {handlePaypalWebhook} = require("../controllers/PaymentController");
const router = express.Router();


router.post('/stripe', handleStripeWebhook);
// router.post('/paypal',handlePaypalWebhook)



module.exports=router
