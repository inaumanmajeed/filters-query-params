import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  cleanObject,
  mergeFilters,
  resetFilters,
  buildQuery,
  parseQuery,
  buildUrl,
} from "../src/core";

const schema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  active: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  birthday: z.date().optional(),
});

describe("utility functions", () => {
  it("cleanObject removes empty values", () => {
    const result = cleanObject(
      {
        name: "John",
        age: "",
        city: null,
        country: undefined,
        active: false,
      },
      { dropEmpty: true }
    );

    expect(result).toEqual({
      name: "John",
      active: false,
    });
  });

  it("cleanObject trims strings", () => {
    const result = cleanObject(
      {
        name: "  John  ",
        city: " New York ",
        empty: "   ",
      },
      { trimStrings: true, dropEmpty: true }
    );

    expect(result).toEqual({
      name: "John",
      city: "New York",
    });
  });

  it("mergeFilters combines objects", () => {
    const current = { name: "John", age: 25 };
    const next = { age: 30, active: true };

    const result = mergeFilters(current, next);

    expect(result).toEqual({
      name: "John",
      age: 30,
      active: true,
    });
  });

  it("mergeFilters with dropEmpty", () => {
    const current = { name: "John", age: 25 };
    const next = { age: undefined, active: true };

    const result = mergeFilters(current, next, { dropEmpty: true });

    expect(result).toEqual({
      name: "John",
      active: true,
    });
  });

  it("resetFilters returns defaults", () => {
    const result = resetFilters(schema, { name: "Default", active: true });

    expect(result).toEqual({
      name: "Default",
      active: true,
    });
  });

  it("resetFilters without defaults", () => {
    const result = resetFilters(schema);

    expect(result).toEqual({});
  });
});

describe("edge cases", () => {
  it("handles empty query string", () => {
    const result = parseQuery(schema, "");
    expect(result).toEqual({});
  });

  it("handles query string without question mark", () => {
    const result = parseQuery(schema, "name=John&age=25", {
      coerceTypes: true,
    });
    expect(result).toEqual({ name: "John", age: 25 });
  });

  it("handles URLSearchParams input", () => {
    const params = new URLSearchParams("name=John&age=25");
    const result = parseQuery(schema, params, { coerceTypes: true });
    expect(result).toEqual({ name: "John", age: 25 });
  });

  it("buildUrl with existing query params", () => {
    const url = buildUrl("/api/users?existing=param", schema, { name: "John" });
    expect(url).toBe("/api/users?existing=param&name=John");
  });

  it("buildUrl with trailing question mark", () => {
    const url = buildUrl("/api/users?", schema, { name: "John" });
    expect(url).toBe("/api/users?name=John");
  });

  it("buildUrl with trailing ampersand", () => {
    const url = buildUrl("/api/users?existing=param&", schema, {
      name: "John",
    });
    expect(url).toBe("/api/users?existing=param&name=John");
  });

  it("handles invalid date strings", () => {
    // Invalid dates should throw ZodError because they don't match the schema
    expect(() =>
      parseQuery(schema, "birthday=invalid-date", { coerceTypes: true })
    ).toThrow();
  });

  it("handles invalid number strings", () => {
    // Invalid numbers should throw ZodError because they don't match the schema
    expect(() =>
      parseQuery(schema, "age=not-a-number", { coerceTypes: true })
    ).toThrow();
  });

  it("encodes dates in buildQuery", () => {
    const date = new Date("2024-01-01T00:00:00.000Z");
    const result = buildQuery(schema, { birthday: date }, { encodeDate: true });
    expect(result.get("birthday")).toBe("2024-01-01T00:00:00.000Z");
  });

  it("handles nested optional types", () => {
    const nestedSchema = z.object({
      value: z.string().optional().nullable(),
    });

    const result = parseQuery(nestedSchema, "value=test", {
      coerceTypes: true,
    });
    expect(result).toEqual({ value: "test" });
  });
});

describe("array handling edge cases", () => {
  it("handles empty comma-separated values", () => {
    const result = parseQuery(schema, "tags=", {
      arrayFormat: "comma",
      dropEmpty: false,
    });
    expect(result.tags).toEqual([]); // Empty string in comma format results in empty array
  });

  it("handles malformed JSON arrays", () => {
    const result = parseQuery(schema, "tags=[invalid-json", {
      arrayFormat: "json",
    });
    expect(result.tags).toEqual([]);
  });

  it("handles single value with repeat format", () => {
    const result = parseQuery(schema, "tags=single", { arrayFormat: "repeat" });
    expect(result.tags).toEqual(["single"]);
  });
});

describe("unknown keys handling", () => {
  it("strips unknown keys by default (Zod behavior)", () => {
    const result = parseQuery(schema, "name=John&unknown=value");
    expect(result).toEqual({ name: "John" }); // Zod only keeps schema fields
  });

  it("strips unknown keys when stripUnknown is true", () => {
    const result = parseQuery(schema, "name=John&unknown=value", {
      stripUnknown: true,
    });
    expect(result).toEqual({ name: "John" });
  });

  it("buildQuery includes unknown keys by default", () => {
    const result = buildQuery(schema, {
      name: "John",
      unknown: "value",
    } as any);
    expect(result.get("name")).toBe("John");
    expect(result.get("unknown")).toBe("value");
  });

  it("buildQuery strips unknown keys when stripUnknown is true", () => {
    const result = buildQuery(
      schema,
      { name: "John", unknown: "value" } as any,
      { stripUnknown: true }
    );
    expect(result.get("name")).toBe("John");
    expect(result.get("unknown")).toBeNull();
  });
});
