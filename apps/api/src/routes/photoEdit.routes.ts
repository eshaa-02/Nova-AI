import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { uploadImageMemory } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { aiRateLimiter } from "../middleware/rateLimit";
import {
  runPhotoEdit,
  editImageSchema,
  listPhotoEdits,
  getPhotoEditFile,
  deletePhotoEdit,
} from "../controllers/photoEdit.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listPhotoEdits);
router.post(
  "/",
  aiRateLimiter,
  asyncHandler(async (req, res, next) => {
    uploadImageMemory(req, res, (err) => (err ? next(err) : next()));
  }),
  validate(editImageSchema),
  runPhotoEdit
);
router.get("/:id/file", getPhotoEditFile);
router.delete("/:id", deletePhotoEdit);

export default router;
