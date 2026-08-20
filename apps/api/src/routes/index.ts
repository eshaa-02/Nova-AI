import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import conversationRoutes, { messageActionsRouter } from "./conversation.routes";
import fileRoutes from "./file.routes";
import searchRoutes from "./search.routes";
import adminRoutes from "./admin.routes";
import imageRoutes from "./image.routes";
import photoEditRoutes from "./photoEdit.routes";
import toolsRoutes from "./tools.routes";
import videoRoutes from "./video.routes";
import musicRoutes from "./music.routes";
import { apiRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", apiRateLimiter, userRoutes);
router.use("/conversations", apiRateLimiter, conversationRoutes);
router.use("/messages", apiRateLimiter, messageActionsRouter);
router.use("/files", apiRateLimiter, fileRoutes);
router.use("/search", searchRoutes);
router.use("/admin", apiRateLimiter, adminRoutes);
router.use("/images", apiRateLimiter, imageRoutes);
router.use("/photo-edits", apiRateLimiter, photoEditRoutes);
router.use("/tools", apiRateLimiter, toolsRoutes);
router.use("/videos", apiRateLimiter, videoRoutes);
router.use("/music", apiRateLimiter, musicRoutes);

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", time: new Date().toISOString() } });
});

export default router;
