import express from "express";
import { updateProfile, updateSettings, changePassword, getReports, getTodayStat, authMe } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authMe);
router.put("/profile", updateProfile);
router.put("/settings", updateSettings);
router.put("/change-password", changePassword);
router.get("/reports", getReports);
router.get("/today-stat", getTodayStat);

export default router;
