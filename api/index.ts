import { createApp } from "../apps/api/src/app";
import { connectDatabase } from "../apps/api/src/config/db";
import type { VercelRequest, VercelResponse } from "@vercel/node";

let dbConnected = false;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (!dbConnected) {
      await connectDatabase();
      dbConnected = true;
    }

    const app = createApp();

    return app(req, res);
  } catch (error) {
    console.error("Nova AI API error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}