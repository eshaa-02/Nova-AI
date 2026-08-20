import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getStats, listUsers, updateUser, updateUserRoleSchema, deleteUser } from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", getStats);
router.get("/users", listUsers);
router.patch("/users/:id", validate(updateUserRoleSchema), updateUser);
router.delete("/users/:id", deleteUser);

export default router;
