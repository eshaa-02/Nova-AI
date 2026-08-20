import rateLimit from "express-rate-limit";

const jsonHandler = (_req: any, res: any) => {
  res.status(429).json({
    success: false,
    message: "Too many requests — please slow down and try again shortly.",
    code: "RATE_LIMITED",
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
