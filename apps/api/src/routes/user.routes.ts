import { Router } from "express";
import { updateProfile, updateProfileSchema, listModels, deleteAccount, deleteAccountSchema } from "../controllers/user.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);
router.patch("/me", validate(updateProfileSchema), updateProfile);
router.delete("/me", validate(deleteAccountSchema), deleteAccount);
router.get("/models", listModels);

export default router;
