// routes/jobRoutes.js
const express = require('express');
const multer = require('multer');
const { storage } = require('../config/cloudinaryConfig');
const { createJob ,getAllJobs, getUserJobs,getFeaturedJobs,getGigDetailsController, deleteJob} = require('../controllers/jobController');
const { verifyToken } = require('../middleware/jwt');

const upload = multer({ storage });

const router = express.Router();

router.get('/', getAllJobs);
router.get("/user",verifyToken,getUserJobs);
router.get("/:id",getGigDetailsController)
router.post('/add-job', upload.any(), createJob);
router.get('/feature', getFeaturedJobs);
router.delete('/:id',verifyToken, deleteJob);


module.exports = router;
