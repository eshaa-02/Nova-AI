import type { Request, Response } from "express";
import { z } from "zod";
import { TOOLS, getToolById } from "../services/tools/tools.catalog";
import { getAIProvider } from "../services/ai/AIProviderFactory";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const listTools = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    tools: TOOLS.map((t) => ({ id: t.id, label: t.label, description: t.description, fields: t.fields })),
  });
});

export const runToolSchema = z.object({
  input: z.string().trim().min(1, "This field is required").max(8000),
  secondary: z.string().trim().max(200).optional(),
});

export const runTool = asyncHandler(async (req: Request, res: Response) => {
  const tool = getToolById(req.params.toolId);
  if (!tool) throw ApiError.notFound("Tool not found");

  const { input, secondary } = req.body as z.infer<typeof runToolSchema>;

  const requiresSecondary = tool.fields.some((f) => f.key === "secondary" && f.required);
  if (requiresSecondary && !secondary?.trim()) {
    throw ApiError.unprocessable("Please fill in the required field.", {
      secondary: `${tool.fields.find((f) => f.key === "secondary")?.label} is required`,
    });
  }

  const prompt = tool.buildPrompt({ input, secondary });
  const provider = getAIProvider();
  const result = await provider.generateText({ history: [{ role: "user", content: prompt }] });

  sendSuccess(res, { toolId: tool.id, result });
});
