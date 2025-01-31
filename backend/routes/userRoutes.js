import express from "express";
import User from "../models/userModel.js";

const router = express.Router();

// Fetch User Details by userId
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId); 

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user); 
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching user details", error: error.message });
    }
});

export default router;
