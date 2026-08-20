import { Router } from "express";
import {
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  createConversationSchema,
  updateConversationSchema,
} from "../controllers/conversation.controller";
import { listMessages, toggleFavorite, deleteMessage } from "../controllers/message.controller";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/", listConversations);
router.post("/", validate(createConversationSchema), createConversation);
router.get("/:id", getConversation);
router.patch("/:id", validate(updateConversationSchema), updateConversation);
router.delete("/:id", deleteConversation);

router.get("/:conversationId/messages", listMessages);

export default router;

export const messageActionsRouter = Router();
messageActionsRouter.use(requireAuth);
messageActionsRouter.post("/:id/favorite", toggleFavorite);
messageActionsRouter.delete("/:id", deleteMessage);
