import { describe, expect, it } from "vitest";
import {
  loginSchema,
  signupSchema,
} from "../../../features/auth/validation";

describe("auth validation", () => {
  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid login email and short passwords", () => {
    const result = loginSchema.safeParse({
      email: "bad-email",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toEqual(
        expect.arrayContaining([
          "Enter a valid email address",
          "Password must be at least 8 characters",
        ])
      );
    }
  });

  it("accepts valid signup input", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects mismatched signup passwords", () => {
    const result = signupSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Passwords do not match");
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });
});
