const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/VATRate'); // VATRate model
require('dotenv').config();

const APP_ID = process.env.APP_ID;
const TAX_API_URL = `https://openexchangerates.org/api/taxes.json?app_id=${APP_ID}`;

// Function to fetch and store VAT rates
const fetchAndStoreVATRates = async () => {
    try {
        // Fetch VAT data from the API
        const response = await axios.get(TAX_API_URL);
        const taxRates = response.data.taxes;

        // Process VAT rates
        const operations = Object.entries(taxRates).map(([country, data]) => ({
            updateOne: {
                filter: { countryCode: country },
                update: {
                    $set: {
                        taxName: data.name,
                        standardRate: data.standard_rate,
                        reducedRates: data.reduced_rates || [],
                        lastUpdated: new Date(),
                    },
                },
                upsert: true, // Insert if not exists
            },
        }));

        // Perform bulk update
        await VATRate.bulkWrite(operations);

        console.log('VAT rates updated successfully.');
    } catch (error) {
        console.error('Error updating VAT rates:', error.message);
    }
};

// Schedule the VAT update to run every 24 hours
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled VAT rates update...');
    fetchAndStoreVATRates();
});

// Export for manual route-based trigger as well
module.exports = { fetchAndStoreVATRates };
