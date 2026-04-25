/**
 * Unit tests for utility functions
 */
import { describe, it, expect } from "vitest";
import { cn, formatDuration, formatRelativeTime, generateId } from "@/lib/utils";

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    });

    it("should merge Tailwind classes correctly", () => {
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    });
  });

  describe("formatDuration", () => {
    it("should format minutes", () => {
      expect(formatDuration(30)).toBe("30m");
    });

    it("should format hours", () => {
      expect(formatDuration(60)).toBe("1h");
    });

    it("should format hours and minutes", () => {
      expect(formatDuration(90)).toBe("1h 30m");
    });
  });

  describe("formatRelativeTime", () => {
    it("should format recent time as 'just now'", () => {
      const now = new Date();
      expect(formatRelativeTime(now)).toBe("just now");
    });

    it("should format minutes ago", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m ago");
    });

    it("should format hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      expect(formatRelativeTime(twoHoursAgo)).toBe("2h ago");
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it("should generate string IDs", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
