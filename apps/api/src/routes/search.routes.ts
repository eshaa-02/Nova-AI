import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { runSearch, searchQuerySchema } from "../controllers/search.controller";
import { aiRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.use(requireAuth);
router.get("/", aiRateLimiter, validate(searchQuerySchema, "query"), runSearch);

export default router;
