import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import { generateImages, generateImagesSchema, listImages, getImageFile, deleteImage } from "../controllers/image.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listImages);
router.post("/", aiRateLimiter, validate(generateImagesSchema), generateImages);
router.get("/:id/file", getImageFile);
router.delete("/:id", deleteImage);

export default router;
