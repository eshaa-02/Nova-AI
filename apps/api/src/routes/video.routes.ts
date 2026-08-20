import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import { generateVideo, generateVideoSchema, listVideos, getVideoFile, deleteVideo } from "../controllers/video.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listVideos);
router.post("/", aiRateLimiter, validate(generateVideoSchema), generateVideo);
router.get("/:id/file", getVideoFile);
router.delete("/:id", deleteVideo);

export default router;
