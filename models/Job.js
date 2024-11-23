const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    cat: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [{ type: String, required: true }], 
    whyChooseMe: { type: String, required: true }, 
    pricingPlan: {
        basic: {
            title: { type: String },
            description: { type: String },
            price: { type: Number },
            deliveryTime: { type: Number } 
        },
        premium: {
            title: { type: String },
            description: { type: String },
            price: { type: Number },
            deliveryTime: { type: Number}
        },
        pro: {
            title: { type: String },
            description: { type: String },
            price: { type: Number },
            deliveryTime: { type: Number}
        }
    },
    addons: {
        title: { type: String },
        extraService: { type: Number },
    },
    faqs: [
        {
            question: { type: String },
            answer: { type: String },
        },
    ],
    jobStatus: { type: String, required: true },
    photos: [{ type: String }],
    upgradeOption: { type: String },
    sellerId: { type: String, required: true },
    totalStars: { type: Number, default: 0 },
    starNumber: { type: Number, default: 0 },
    sales: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
