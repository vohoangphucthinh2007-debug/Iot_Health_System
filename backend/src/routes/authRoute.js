import express from "express";
import {
  refreshToken,
  signIn,
  signOut,
  signUp,
  checkDuplicate,
} from "../controllers/authController.js";

const router = express.Router();
router.get("/check-duplicate", checkDuplicate);

router.post("/signup", signUp);

router.post("/signin", signIn);

router.post("/signout", signOut);

router.post("/refresh", refreshToken);

export default router;
