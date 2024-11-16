const express = require("express");
const router = express.Router();
const { deleteUser, getTotalUsers, getAllUsers, warnUser, blockUser, getVerifiedSellers } = require("../controllers/userController"); // Correct
const {verifyToken}=require("../middleware/jwt")

router.get('/', getAllUsers);
router.put('/warn/:userId', warnUser);
router.put('/block/:userId', blockUser);
router.delete("/delete/:id",verifyToken, deleteUser);
router.get("/total-users",getTotalUsers);
router.get('/verified-sellers', getVerifiedSellers);


module.exports=router
