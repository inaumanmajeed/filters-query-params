import { z } from "zod";
import type { AnySchema, ParseOptions } from "./types";
import { parseQuery } from "./core";

export function getFiltersFromUrl<TSchema extends AnySchema>(
  schema: TSchema,
  fullUrl: string,
  options: ParseOptions<TSchema> = { coerceTypes: true, dropEmpty: true, trimStrings: true, stripUnknown: true }
): z.infer<TSchema> {
  const u = new URL(fullUrl, "http://localhost");
  return parseQuery(schema, u.search, options);
}

export function getFiltersFromSearch<TSchema extends AnySchema>(
  schema: TSchema,
  search: string,
  options: ParseOptions<TSchema> = { coerceTypes: true, dropEmpty: true, trimStrings: true, stripUnknown: true }
): z.infer<TSchema> {
  return parseQuery(schema, search, options);
}