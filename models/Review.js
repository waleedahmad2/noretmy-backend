// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const reviewSchema = new mongoose.Schema({

  gigId:{type:String, required:true},
  userId:{type:String, required:true},
  star:{type:Number, required:true,enum:[1,2,3,4,5]},
  desc:{type:String, required:true},
  
},{
  timestamps:true
});



module.exports = mongoose.model('Reviews', reviewSchema);
