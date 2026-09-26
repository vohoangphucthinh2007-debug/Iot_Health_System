import express from "express";
import { updateProfile, getReports } from "../controllers/userController.js";
import { authMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMe);
router.put("/profile", updateProfile);
router.get("/reports", getReports);

export default router;
