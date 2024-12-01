const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/Vat'); // VATRate model
require('dotenv').config();

// API key from your Tax Data API account
const API_KEY = process.env.API_KEY;

// Updated API endpoint for global tax rates
const TAX_API_URL = `https://api.apilayer.com/tax_data/tax_rates`;

// Function to fetch and store VAT rates
const fetchAndStoreVATRates = async () => {
    try {
        // Fetch global VAT data from the API
        const response = await axios.get(TAX_API_URL, {
            headers: { 'apikey': API_KEY }
        });

        // Check the response structure
        if (!response.data || !response.data.rates) {
            throw new Error("Unexpected response format from API");
        }

        const taxRates = response.data.rates; // Adjusting based on response structure

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

        // Perform bulk update to save VAT data in MongoDB
        await VATRate.bulkWrite(operations);

        console.log('VAT rates updated successfully.');
    } catch (error) {
        console.error('Error updating VAT rates:', error.response ? error.response.data : error.message);
    }
};

// Schedule the VAT update to run every 24 hours
cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled VAT rates update...');
    fetchAndStoreVATRates();
});

// Export for manual route-based trigger as well
module.exports = { fetchAndStoreVATRates };
