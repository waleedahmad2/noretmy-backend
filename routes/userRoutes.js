const express = require("express");
const router = express.Router();
const { deleteUser, getTotalUsers, getAllUsers, warnUser, blockUser, getVerifiedSellers, createOrUpdateProfile, updateSingleAttribute } = require("../controllers/userController"); // Correct
const {verifyToken}=require("../middleware/jwt")

router.get('/', getAllUsers);
router.put('/warn/:userId', warnUser);
router.put('/block/:userId', blockUser);
router.delete("/delete/:id",verifyToken, deleteUser);
router.get("/total-users",getTotalUsers);
router.get('/verified-sellers', getVerifiedSellers);
router.post('/user/profile', createOrUpdateProfile);
router.put('/user/profile/:userId', updateSingleAttribute);


module.exports=router
