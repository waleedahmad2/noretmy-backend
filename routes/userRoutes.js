const express = require("express");
const router = express.Router();
const { deleteUser, getTotalUsers, getAllUsers } = require("../controllers/userController"); // Correct
const {verifyToken}=require("../middleware/jwt")

router.get('/', getAllUsers);
router.delete("/delete/:id",verifyToken, deleteUser);
router.get("/total-users",getTotalUsers);

module.exports=router
