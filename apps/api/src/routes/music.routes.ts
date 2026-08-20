import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import { generateMusic, generateMusicSchema, listMusic, getMusicFile, deleteMusic } from "../controllers/music.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listMusic);
router.post("/", aiRateLimiter, validate(generateMusicSchema), generateMusic);
router.get("/:id/file", getMusicFile);
router.delete("/:id", deleteMusic);

export default router;
