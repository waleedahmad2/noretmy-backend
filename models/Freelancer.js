// models/Freelancer.js
const mongoose = require('mongoose');

const freelancerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    stripeAccountId: {
        type: String,
        required: true,
    },
    availableBalance: {
        type: Number,
        default: 0,
    },
});

const Freelancer = mongoose.model('Freelancer', freelancerSchema);
module.exports = Freelancer;
