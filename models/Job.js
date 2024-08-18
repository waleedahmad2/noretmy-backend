// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [{ type: String, required: true }],  // Array of strings
    whyChooseMe: { type: String, required: true }, // Changed to string
    pricingPlan: {
        basic: { type: Number },
        premium: { type: Number },
        pro: { type: Number },
    },
    addons: {
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
    videos: [{ type: String }],
    audios: [{ type: String }],
    upgradeOption: { type: String },
    sellerId:{type:String,required:true}
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
