const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/Vat'); // VATRate model
require('dotenv').config();

// API key from your VATSense account
const API_KEY = process.env.VAT_API_KEY;

const TAX_API_URL = `https://api.vatsense.com/1.0/rates`;

const fetchAndStoreVATRates = async () => {
    try {
        // Fetch global VAT data from the API
        const response = await axios.get(TAX_API_URL, {
            auth: {
                username: 'user', // Basic Auth username
                password: API_KEY // Use your VATSense API Key here
            }
        });

        // Check the response structure
        if (!response.data || !response.data.data) {
            throw new Error("Unexpected response format from API");
        }

        const taxRates = response.data.data; // Adjusting based on VATSense API response structure

        // Process VAT rates
        const operations = taxRates.map((data) => ({
            updateOne: {
                filter: { countryCode: data.country_code },
                update: {
                    $set: {
                        countryName: data.country_name,
                        standardRate: data.standard.rate,
                        reducedRates: data.other.map(rate => ({
                            rate: rate.rate,
                            description: rate.description,
                            class: rate.class
                        })),
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
