import express from "express";
import { updateProfile, updateSettings, changePassword, getReports, getTodayStat, authMe, getCalories, getAiInsight } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMe);
router.put("/profile", updateProfile);
router.put("/settings", updateSettings);
router.put("/change-password", changePassword);
router.get("/reports", getReports);
router.get("/today-stat", getTodayStat);
router.post("/calories", getCalories);
router.post("/ai-insight", getAiInsight);

export default router;
