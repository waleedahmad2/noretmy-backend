const express = require('express');
const { fetchAndStoreVATRates } = require('../controllers/vatController');

const router = express.Router();

// Route to update VAT rates
router.get('/update-vat-rates', fetchAndStoreVATRates);

module.exports = router;
