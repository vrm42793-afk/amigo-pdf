import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { describe, it, expect } from "vitest";

describe("Authentication Schema Validation", () => {
  describe("Signup Schema", () => {
    it("should accept valid signup data", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should fail if password and confirmPassword do not match", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123!",
        confirmPassword: "Password1234!",
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords do not match");
      }
    });

    it("should fail for weak passwords missing special characters", () => {
      const invalidData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Password must contain at least one");
      }
    });

    it("should fail for invalid emails", () => {
      const invalidData = {
        name: "John Doe",
        email: "invalid-email",
        password: "Password123!",
        confirmPassword: "Password123!",
      };
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email address");
      }
    });
  });

  describe("Login Schema", () => {
    it("should accept valid credentials", () => {
      const validData = {
        email: "john@example.com",
        password: "somepassword",
      };
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty password", () => {
      const invalidData = {
        email: "john@example.com",
        password: "",
      };
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("Forgot Password Schema", () => {
    it("should accept valid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "john@example.com" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
      expect(result.success).toBe(false);
    });
  });

  describe("Reset Password Schema", () => {
    it("should accept matching strong passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "SecurePassword1!",
        confirmPassword: "SecurePassword1!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject mismatching passwords", () => {
      const result = resetPasswordSchema.safeParse({
        password: "SecurePassword1!",
        confirmPassword: "SecurePassword2!",
      });
      expect(result.success).toBe(false);
    });
  });
});
