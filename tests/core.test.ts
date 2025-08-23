import { describe, it, expect } from "vitest";
import { z } from "zod";
import { buildQuery, buildUrl, parseQuery } from "../src/core";

const schema = z.object({
  search: z.string().optional(),
  priceMin: z.number().int().optional(),
  priceMax: z.number().int().optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.date().optional()
});

describe("core parse/build", () => {
  it("parses numbers/booleans/dates with coercion", () => {
    const now = new Date().toISOString();
    const q = `?priceMin=10&priceMax=20&inStock=true&createdAfter=${encodeURIComponent(now)}`;
    const parsed = parseQuery(schema, q, { coerceTypes: true });
    expect(parsed.priceMin).toBe(10);
    expect(parsed.priceMax).toBe(20);
    expect(parsed.inStock).toBe(true);
    expect(parsed.createdAfter?.toISOString()).toBe(now);
  });

  it("parses repeat arrays", () => {
    const parsed = parseQuery(schema, "?tags=a&tags=b", { arrayFormat: "repeat" });
    expect(parsed.tags).toEqual(["a", "b"]);
  });

  it("parses comma arrays", () => {
    const parsed = parseQuery(schema, "?tags=a,b", { arrayFormat: "comma" });
    expect(parsed.tags).toEqual(["a", "b"]);
  });

  it("parses json arrays", () => {
    const parsed = parseQuery(schema, "?tags=%5B%22a%22%2C%22b%22%5D", { arrayFormat: "json" });
    expect(parsed.tags).toEqual(["a", "b"]);
  });

  it("builds URL with repeat arrays", () => {
    const url = buildUrl("/api/items", schema, { tags: ["a","b"] }, { arrayFormat: "repeat" });
    expect(url).toBe("/api/items?tags=a&tags=b");
  });

  it("builds URL with comma arrays", () => {
    const url = buildUrl("/api/items", schema, { tags: ["a","b"] }, { arrayFormat: "comma" });
    expect(url).toBe("/api/items?tags=a%2Cb");
  });

  it("drops empty and trims", () => {
    const qs = buildQuery(schema, { search: "  " } as any, { dropEmpty: true, trimStrings: true }).toString();
    expect(qs).toBe("");
  });
});
