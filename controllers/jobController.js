// controllers/jobController.js
const Job = require('../models/Job');
// const { options } = require('../routes/messageRoutes');

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
      const { userId } = req.body; // Extract userId from request body
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      const jobs = await Job.find({ sellerId: userId }); // Adjust query field if necessary
  
      if (!jobs || jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }
  
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };


  const getFeaturedJobs = async (req, res) => {
    try {
      const jobs = await Job.find({ upgradeOption: "Feature listing" }); // Adjust query field if necessary
  
      if (!jobs || jobs.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }
  
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
  

  const deleteJob= async (req,res)=>{
    try{

        const gig= await Job.findById(req.params.id);

        if(!gig) return   res.status(404).json({ message: "No gig found" })
            console.log(req.id);

        if(gig.sellerId !== req.userId) return   res.status(403).json({ message: "You can only delete your gig" });


        await Job.findByIdAndDelete(req.params.id);

        res.status(200).send("Gig has been deleted");



    }
    catch(error){
        res.status(500).json({ message: "Server Error", error: error.message });

    }

  }

module.exports = { createJob ,getAllJobs,getUserJobs,getFeaturedJobs,deleteJob};
