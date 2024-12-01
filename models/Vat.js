const mongoose = require('mongoose');

const VATSchema = new mongoose.Schema({
    countryCode: { type: String, required: true, unique: true }, 
    countryName :{type:String , required:true},
    standardRate: { type: Number, required: true },             
    reducedRates: { type: [Number], default: [] },            
    lastUpdated: { type: Date, default: Date.now },             
});

module.exports = mongoose.model('VATRate', VATSchema);
