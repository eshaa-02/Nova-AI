import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { uploadSingleFile } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  uploadFile,
  listFiles,
  deleteFile,
  downloadFile,
  runFileAction,
  fileActionSchema,
} from "../controllers/file.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listFiles);
router.post(
  "/",
  asyncHandler(async (req, res, next) => {
    uploadSingleFile(req, res, (err) => (err ? next(err) : next()));
  }),
  uploadFile
);
router.get("/:id/download", downloadFile);
router.delete("/:id", deleteFile);
router.post("/:id/actions", validate(fileActionSchema), runFileAction);

export default router;
