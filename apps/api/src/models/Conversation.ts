import { Schema, model, Types } from "mongoose";

export interface IConversation {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  model: string;
  systemPrompt?: string;
  isPinned: boolean;
  isArchived: boolean;
  folder?: string;
  lastMessagePreview?: string;
  messageCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New chat",
      maxlength: 200,
    },
    model: {
      type: String,
      default: "nova-balanced",
    },
    systemPrompt: {
      type: String,
      maxlength: 4000,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    folder: {
      type: String,
    },
    lastMessagePreview: {
      type: String,
      maxlength: 280,
    },
    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({
  userId: 1,
  isArchived: 1,
  updatedAt: -1,
});

conversationSchema.index({
  userId: 1,
  title: "text",
});

export const Conversation = model<IConversation>(
  "Conversation",
  conversationSchema
);