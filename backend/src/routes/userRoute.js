import express from "express";
import { authMe } from "../controllers/userController.js";
import { updateProfile } from "../controllers/authController.js"; // Trỏ đúng về authController

const router = express.Router();

router.get("/me", authMe);
router.put("/profile", updateProfile);

export default router;
