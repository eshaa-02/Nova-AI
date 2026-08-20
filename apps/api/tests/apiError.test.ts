import { describe, it, expect } from "vitest";
import { ApiError } from "../src/utils/ApiError";

describe("ApiError", () => {
  it("builds a 401 with the UNAUTHENTICATED code by default", () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHENTICATED");
  });

  it("builds a 422 carrying field errors", () => {
    const err = ApiError.unprocessable("Please fix the form", { email: "Invalid email" });
    expect(err.statusCode).toBe(422);
    expect(err.errors).toEqual({ email: "Invalid email" });
  });

  it("builds a 429 rate limit error", () => {
    const err = ApiError.tooManyRequests();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
  });
});
