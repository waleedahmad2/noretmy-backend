const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Reviews = require('../models/Review');
const {  translateJob, translateReviews } = require('../services/translateService'); 


const createJob = async (req, res) => {
    try {
        const {
            title,
            location,
            cat,   // Category is now included
            description,
            keywords,
            whyChooseMe,
            pricingPlan,
            addons,
            faqs,
            jobStatus,
            photos,
            upgradeOption,
            sellerId,
            totalStars,
            starNumber,
            sales
        } = req.body;

        // Ensure required fields are provided
        if (!title || !location || !cat || !description || !sellerId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if the user is a seller (you might need to add more logic here to validate the seller)
        // This is just an example; you can customize this check based on your application's logic
        if (!sellerId) {
            return res.status(403).json({ message: 'Unauthorized: Seller ID is required' });
        }

        // Create a new job with the provided details
        const newJob = new Job({
            title,
            location,
            cat,  // Ensure category is included
            description,
            keywords,  // Keywords array
            whyChooseMe,
            pricingPlan,
            addons,
            faqs,
            jobStatus,
            photos,  // Array of photo URLs
            upgradeOption,
            sellerId,
            totalStars,
            starNumber,
            sales
        });

        // Save the new job to the database
        await newJob.save();
        res.status(201).json(newJob);  // Respond with the created job
    } catch (error) {
        console.error('Error creating job:', error);  // Log the error for debugging
        res.status(500).json({ message: 'Server Error', error: error.message });  // Include error message for better debugging
    }
};



const getAllJobs= async (req,res) =>{
    const q= req.query;


    const filters = {
        ...(q.cat && { category: q.cat }),  // Category filter
        ...(q.min && { 'pricingPlan.basic': { $gte: parseFloat(q.min) } }),  // Minimum price filter for basic plan
        ...(q.max && { 'pricingPlan.pro': { $lte: parseFloat(q.max) } }),  // Maximum price filter for pro plan
        ...(q.location && { location: q.location }),  // Location filter
        ...(q.keywords && { keywords: { $in: q.keywords.split(',') } }),  // Keywords filter (split by commas)
        ...(q.deliveryTime && {
            deliveryTime: {
                $gte: {
                    '24 hours': 1,
                    '1 day': 1,
                    'up to 3 days': 3,
                    'up to 1 week': 7,
                    'up to 1 month': 30,
                    'Anytime': 0
                }[q.deliveryTime] || 0
            }
        }),
        ...(q.sold && { sold: q.sold === 'true' ? true : false }),  // Sold filter
        ...(q.search && {
            $or: [
                { title: { $regex: q.search, $options: 'i' } },  // Search in title
                { description: { $regex: q.search, $options: 'i' } }  // Search in description
            ]
        })
    };


    try {
        const jobs = await Job.find(filters); // Fetch all orders from the database
    
        if (!jobs) {
          return res.status(404).json({ message: "No jobs found" });
        }
    
        res.status(200).json(jobs); // Respond with the user data
      } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
      }


}

const getUserJobs = async (req, res) => {
    try {
      const { userId } = req; 
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      const jobs = await Job.find({ sellerId: userId }); 
  
      if (!jobs || jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }
  
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };


  // const getFeaturedJobs = async (req, res) => {
  //   try {
  //     const jobs = await Job.find({ upgradeOption: "Feature listing" }); // Adjust query field if necessary
  
  //     if (!jobs || jobs.length === 0) {
  //       return res.status(404).json({ message: "No jobs found" });
  //     }
  
  //     res.status(200).json(jobs);
  //   } catch (error) {
  //     res.status(500).json({ message: "Server Error", error: error.message });
  //   }
  // };
  


// const getFeaturedJobs = async (req, res) => {
//   try {
//     const { lang } = req.query;

//     const jobs = await Job.find({ upgradeOption: "Feature listing" });

//     if (!jobs || jobs.length === 0) {
//       return res.status(404).json({ message: "No jobs found" });
//     }

//     if (lang) {
//       const translatedJobs = await Promise.all(
//         jobs.map(async (job) => {
//           const translatedJob = {
//             ...job._doc, 
//             title: await translateText(job.title, "en", lang),
//             description: await translateText(job.description, "en", lang),
//             pricingPlan: {
//               basic: {
//                 title: await translateText(job.pricingPlan.basic.title, "en", lang),
//                 description: await translateText(job.pricingPlan.basic.description, "en", lang),
//               },
//               premium: {
//                 title: await translateText(job.pricingPlan.premium.title, "en", lang),
//                 description: await translateText(job.pricingPlan.premium.description, "en", lang),
//               },
//               pro: {
//                 title: await translateText(job.pricingPlan.pro.title, "en", lang),
//                 description: await translateText(job.pricingPlan.pro.description, "en", lang),
//               }
//             },
//             addons: {
//               title: await translateText(job.addons.title, "en", lang),
//             },
//             faqs: await Promise.all(
//               job.faqs.map(async (faq) => ({
//                 question: await translateText(faq.question, "en", lang),
//                 answer: await translateText(faq.answer, "en", lang),
//               }))
//             ),
//             whyChooseMe: await translateText(job.whyChooseMe, "en", lang),
//           };
//           return translatedJob;
//         })
//       );

//       return res.status(200).json(translatedJobs);
//     }

//     return res.status(200).json(jobs); 

//   } catch (error) {
//     console.error("Error fetching featured jobs:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };


const getFeaturedJobs = async (req, res) => {
  try {
    const { lang } = req.query;

    const jobs = await Job.find({ upgradeOption: "Feature listing" });

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: "No jobs found" });
    }

    if (lang) {
      const translatedJobs = await Promise.all(jobs.map((job) => translateJob(job, lang)));
      return res.status(200).json(translatedJobs);
    }

    return res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching featured jobs:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



  const deleteJob = async (req, res) => {
    try {
      const { userId } = req;
  
      // Verify that userId exists
      if (!userId) {
        return res.status(400).send("User is not verified");
      }
  
      const gig = await Job.findById(req.params.id);
  
      // Check if gig exists
      if (!gig) {
        return res.status(404).json({ message: "No gig found" });
      }
  
      // Check if the logged-in user is the owner of the gig
      if (gig.sellerId !== userId) {
        return res.status(403).json({ message: "You can only delete your gig" });
      }
  
      // Delete the gig
      await Job.findByIdAndDelete(req.params.id);
  
      res.status(200).send("Gig has been deleted");
    } catch (error) {
      if (error.name === "CastError") {
        return res.status(400).json({ message: "Invalid Job ID" });
      }
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };




// Function to get gig details, seller info, and reviews
// const getGigDetails = async (gigId) => {
//   try {
//     // Fetch the gig details using gigId
//     const gig = await Job.findById(gigId);
//     if (!gig) {
//       return { error: "Gig not found" }; // Return meaningful message
//     }

//     // Fetch the seller's user profile using the sellerId from the gig
//     const seller = await User.findById(gig.sellerId) || { fullName: "Unknown Seller", _id: null };

//     // Fetch the seller's profile picture and full name using the sellerId
//     const userProfile = await UserProfile.findOne({ userId: seller._id?.toString() }) || { profilePicture: "/default-avatar.png" };

//     // Fetch all reviews for this gig using gigId
//     const reviews = await Reviews.find({ gigId: gigId }) || []; // Empty array if no reviews

//     // Calculate the average rating (out of 5) from the reviews
//     const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);
//     const averageRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(2) : "N/A";

//     // Structure the data to be returned
//     const gigDetails = {
//       gig: gig,
//       seller: {
//         fullName: seller.fullName || "Unknown Seller",
//         userId: seller._id,
//         profilePicture: userProfile.profilePicture,
//       },
//       reviews: reviews,
//       averageRating: averageRating, // rounded to 2 decimal places
//     };

//     return gigDetails;
//   } catch (error) {
//     console.error(error.message);
//     return { error: "An unexpected error occurred" }; // General error response
//   }
// };


const getGigDetails = async (gigId,lang) => {


  try {
    // Fetch the gig details using gigId
    const gig = await Job.findById(gigId);
    if (!gig) {
      return { error: "Gig not found" };
    }

    // Fetch the seller's user profile using the sellerId from the gig
    const seller = await User.findById(gig.sellerId) || { fullName: "Unknown Seller", _id: null };

    // Fetch the seller's profile picture and full name using the sellerId
    const userProfile = await UserProfile.findOne({ userId: seller._id?.toString() }) || { profilePicture: "/default-avatar.png" };

    // Fetch all reviews for this gig using gigId
    const reviews = await Reviews.find({ gigId: gigId }) || [];

    const translatedGig=null;
    const translatedReviews= null;

    if(lang){
      translatedGig = await translateJob(gig,lang);
      translatedReviews = await translateReviews(reviews.map((review) => review.toObject()), lang);


    }

    // Fetch user details (username and profile picture) for each review
    const reviewsWithUserDetails = await Promise.all(
     (translatedReviews || reviews).map(async (review) => {
        const user = await User.findById(review.userId) || { username: "Unknown User" };
        const userProfile = await UserProfile.findOne({ userId: review.userId }) || { profilePicture: "/default-avatar.png" };
        return {
          ...review.toObject(),
          user: {
            username: user.username,
            profilePicture: userProfile.profilePicture,
          },
        };
      })
    );

    
    // Calculate the average rating (out of 5) from the reviews
    const totalStars = reviews.reduce((sum, review) => sum + review.star, 0);
    const averageRating = reviews.length > 0 ? (totalStars / reviews.length).toFixed(2) : "N/A";

    // Structure the data to be returned
    const gigDetails = {
      gig: translatedGig || gig,
      seller: {
        fullName: seller.fullName || "Unknown Seller",
        userId: seller._id,
        profilePicture: userProfile.profilePicture,
      },
      reviews: reviewsWithUserDetails,
      averageRating: averageRating,
    };

    return gigDetails;
  } catch (error) {
    console.error(error.message);
    return { error: "An unexpected error occurred" };
  }
};



// Controller function to handle gig details route
const getGigDetailsController = async (req, res) => {
  const { id } = req.params;

  const { lang } = req.query;

  
  const gigDetails = await getGigDetails(id,lang);

  if (gigDetails.error) {
    return res.status(404).json({ message: gigDetails.error });
  }

  res.status(200).json(gigDetails);
};



  

module.exports = { createJob ,getAllJobs,getUserJobs,getFeaturedJobs  ,getGigDetailsController,deleteJob};
