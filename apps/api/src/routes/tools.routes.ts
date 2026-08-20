import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiRateLimiter } from "../middleware/rateLimit";
import { listTools, runTool, runToolSchema } from "../controllers/tools.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listTools);
router.post("/:toolId/run", aiRateLimiter, validate(runToolSchema), runTool);

export default router;
