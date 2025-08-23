import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import {
  debounce,
  createDebouncedParseQuery,
  createDebouncedBuildUrl,
  createDebouncedBuildQuery,
} from "../src/core";

describe("debounce functionality", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("debounce utility", () => {
    it("debounces function calls", async () => {
      const mockFn = vi.fn((x: number) => x * 2);
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      const promise1 = debouncedFn(1);
      const promise2 = debouncedFn(2);
      const promise3 = debouncedFn(3);

      // Function should not have been called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast-forward time
      vi.advanceTimersByTime(100);

      // Wait for promises to resolve
      const results = await Promise.all([promise1, promise2, promise3]);

      // Function should have been called only once with the last value
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(3);
      // All promises should resolve to the same result
      expect(results).toEqual([6, 6, 6]);
    });

    it("can be cancelled", async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      const promise = debouncedFn();
      debouncedFn.cancel();

      vi.advanceTimersByTime(200);

      // Expect the promise to be rejected
      await expect(promise).rejects.toThrow("Debounced function was cancelled");
      expect(mockFn).not.toHaveBeenCalled();
    });

    it("can be flushed", async () => {
      const mockFn = vi.fn((x: number) => x * 2);
      const debouncedFn = debounce(mockFn, 100);

      const promise = debouncedFn(1);
      const result = debouncedFn.flush(2);

      expect(result).toBe(4);
      expect(mockFn).toHaveBeenCalledWith(2);

      // The original promise should be rejected
      await expect(promise).rejects.toThrow("Debounced function was cancelled");
    });

    it("uses default delay of 300ms", async () => {
      const mockFn = vi.fn((x: number) => x);
      const debouncedFn = debounce(mockFn);

      const promise = debouncedFn(1);

      // Should not execute before 300ms
      vi.advanceTimersByTime(299);
      expect(mockFn).not.toHaveBeenCalled();

      // Should execute after 300ms
      vi.advanceTimersByTime(1);
      await promise;
      expect(mockFn).toHaveBeenCalledWith(1);
    });
  });

  describe("debounced query functions", () => {
    const schema = z.object({
      search: z.string().optional(),
      page: z.number().optional(),
      tags: z.array(z.string()).optional(),
    });

    it("createDebouncedParseQuery works", async () => {
      const debouncedParseQuery = createDebouncedParseQuery(schema, 100);

      const promise1 = debouncedParseQuery("?search=test&page=1", {
        coerceTypes: true,
      });
      const promise2 = debouncedParseQuery("?search=final&page=2", {
        coerceTypes: true,
      });

      vi.advanceTimersByTime(100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should resolve to the same (latest) result
      expect(result1).toEqual({ search: "final", page: 2 });
      expect(result2).toEqual({ search: "final", page: 2 });
    });

    it("createDebouncedBuildUrl works", async () => {
      const debouncedBuildUrl = createDebouncedBuildUrl(schema, 100);

      const promise1 = debouncedBuildUrl("/search", {
        search: "test",
        page: 1,
      });
      const promise2 = debouncedBuildUrl("/search", {
        search: "final",
        page: 2,
      });

      vi.advanceTimersByTime(100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should resolve to the same (latest) result
      expect(result1).toBe("/search?search=final&page=2");
      expect(result2).toBe("/search?search=final&page=2");
    });

    it("createDebouncedBuildQuery works", async () => {
      const debouncedBuildQuery = createDebouncedBuildQuery(schema, 100);

      const promise1 = debouncedBuildQuery({ search: "test", page: 1 });
      const promise2 = debouncedBuildQuery({ search: "final", page: 2 });

      vi.advanceTimersByTime(100);

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // Both should resolve to the same (latest) result
      expect(result1.toString()).toBe("search=final&page=2");
      expect(result2.toString()).toBe("search=final&page=2");
    });

    it("debounced functions can be cancelled", async () => {
      const debouncedParseQuery = createDebouncedParseQuery(schema, 100);

      const promise = debouncedParseQuery("?search=test");
      debouncedParseQuery.cancel();

      vi.advanceTimersByTime(200);

      // Should reject the promise
      await expect(promise).rejects.toThrow("Debounced function was cancelled");
    });

    it("debounced functions can be flushed", async () => {
      const debouncedParseQuery = createDebouncedParseQuery(schema, 100);

      const promise = debouncedParseQuery("?search=test");
      const result = debouncedParseQuery.flush("?search=flushed&page=5", {
        coerceTypes: true,
      });

      expect(result).toEqual({ search: "flushed", page: 5 });

      // The original promise should be rejected
      await expect(promise).rejects.toThrow("Debounced function was cancelled");
    });
  });
});
