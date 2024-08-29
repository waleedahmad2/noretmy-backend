const Job = require("../models/Job");
const Review = require("../models/Review");

const createReview =async(req,res,next)=>{
    if(req.isSeller) return res.status(403).send("Seller is not allowed to creat reviews!");

const newReview= new Review({
    userId:req.userId,
    gigId:req.body.gigId,
    desc :req.body.desc,
    star:req.body.star,


})

    try {
const review= await Review.findOne({gigId:req.body.gigId,userId:req.userId})

if(review) return res.status(403).send("You have already created review for this gig!");

const savedReview=await newReview.save();


await Job.findByIdAndUpdate(req.body.gigId,{
    $inc:{totalStars:req.body.star,starNumber:1}
});

res.status(201).send("Review created!");
        
    } catch (error) {
        next(error);
    }
}


 const getReviews=async(req,res,next)=>{
    try {
        
        const reviews= await Review.find({gigId : req.params.id});
        res.status(200).send(reviews);
    } catch (error) {
        next(error);
    }



}

 const deleteReview=async(req,res,next)=>{
    try {
        
        
    } catch (error) {
        next(error);
    }
}

module.exports={ createReview,deleteReview,getReviews}