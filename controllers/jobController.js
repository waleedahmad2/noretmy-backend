// controllers/jobController.js
const Job = require('../models/Job');

const createJob = async (req, res) => {
    try {
        const {
            title,
            location,
            description,
            keywords,
            whyChooseMe,
            pricingPlan,
            addons,
            faqs,
            jobStatus,
            photos,
            videos,
            audios,
            upgradeOption,
            sellerId,
        } = req.body;

        const newJob = new Job({
            title,
            location,
            description,
            keywords,  // No need to split; it's already an array
            whyChooseMe,
            pricingPlan,
            addons,
            faqs,
            jobStatus,
            photos,  // Array of photo URLs
            videos,  // Array of video URLs
            audios,  // Array of audio URLs
            upgradeOption,
            sellerId,
        });

        await newJob.save();
        res.status(201).json(newJob);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};


const getAllJobs= async (req,res) =>{
    try {
        const jobs = await Job.find(); // Fetch all orders from the database
    
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
  

module.exports = { createJob ,getAllJobs,getUserJobs,getFeaturedJobs};
