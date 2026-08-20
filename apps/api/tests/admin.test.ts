import { describe, it, expect } from "vitest";
import { updateUserRoleSchema } from "../src/controllers/admin.controller";

describe("admin updateUserRoleSchema", () => {
  it("accepts a partial role update", () => {
    const result = updateUserRoleSchema.safeParse({ role: "admin" });
    expect(result.success).toBe(true);
  });

  it("accepts a partial isDisabled update", () => {
    const result = updateUserRoleSchema.safeParse({ isDisabled: true });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid role value", () => {
    const result = updateUserRoleSchema.safeParse({ role: "superuser" });
    expect(result.success).toBe(false);
  });
});
