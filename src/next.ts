import { z } from "zod";
import type { AnySchema, ParseOptions } from "./types";
import { parseQuery } from "./core";

/**
 * Parses filters from a complete URL (useful in API routes or server components)
 * @param schema - Zod schema for filter validation
 * @param fullUrl - Complete URL including protocol and host
 * @param options - Parsing options
 * @returns Parsed and validated filters
 */
export function getFiltersFromUrl<TSchema extends AnySchema>(
  schema: TSchema,
  fullUrl: string,
  options: ParseOptions<TSchema> = { coerceTypes: true, dropEmpty: true, trimStrings: true, stripUnknown: true }
): z.infer<TSchema> {
  const u = new URL(fullUrl, "http://localhost");
  return parseQuery(schema, u.search, options);
}

/**
 * Parses filters from a search string (useful when you have just the query part)
 * @param schema - Zod schema for filter validation
 * @param search - Search string (with or without leading ?)
 * @param options - Parsing options
 * @returns Parsed and validated filters
 */
export function getFiltersFromSearch<TSchema extends AnySchema>(
  schema: TSchema,
  search: string,
  options: ParseOptions<TSchema> = { coerceTypes: true, dropEmpty: true, trimStrings: true, stripUnknown: true }
): z.infer<TSchema> {
  return parseQuery(schema, search, options);
}
