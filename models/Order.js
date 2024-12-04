// models/Job.js
const mongoose = require('mongoose');

// Define the milestone schema
const milestoneSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    deliveryTime : {type:Number,required:true},
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', "started", 'completed','requestedRevision','approved'], default: 'pending' },
  }, {
    timestamps: true
  });
  
const orderSchema = new mongoose.Schema({
   gigId:{type:String, required:true},
   price:{type:Number,required:true},
   feeAndTax:{type:Number,required:true},
   sellerId:{type:String,required:true},
   buyerId:{type:String,required:true},
   status :{type:String,required:true},
   orderRequirements :{type:String,required:false},
   attachments:[{ type: String,required:false }],
   paymentMethod:{type:String,required:false},
   amount_received:{type:Number,required:false},
   last_payment_error:{type:String,required:false},
   isCompleted:{type:Boolean,default:false},
   payment_intent:{type:String,required :false},
   isMilestone: { type: Boolean, default: false } ,
   milestones: { type: [milestoneSchema], default: [] }, // Milestones array is optional
}, {
    timestamps: true
});


module.exports = mongoose.model('Order', orderSchema);
