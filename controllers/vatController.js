const axios = require('axios');
const cron = require('node-cron');
const VATRate = require('../models/Vat'); // VATRate model
require('dotenv').config();

const API_KEY = process.env.VAT_API_KEY;

// Updated API endpoint for global tax rates
const TAX_API_URL = `https://api.apilayer.com/tax_data/tax_rates`;

// Function to fetch and store VAT rates
const fetchAndStoreVATRates = async () => {
    try {
        const response = await axios.get(TAX_API_URL, {
            headers: { 'apikey': API_KEY }
        });

        const taxRates = response.data.rates; 

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
                upsert: true,
            },
        }));

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
