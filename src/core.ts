import { z } from "zod";
import type { AnySchema, BuildOptions, CleanOptions, ParseOptions } from "./types";
import { resolveArraySerializer } from "./serializers";

function isEmpty(val: unknown) {
  return val === undefined || val === null || (typeof val === "string" && val.trim() === "");
}

export function cleanObject<T extends Record<string, any>>(obj: T, opts: CleanOptions = {}): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (opts.trimStrings && typeof v === "string") {
      const t = v.trim();
      if (!(opts.dropEmpty && t === "")) out[k as keyof T] = t as any;
    } else if (opts.dropEmpty && isEmpty(v)) {
      // skip
    } else {
      out[k as keyof T] = v as any;
    }
  }
  return out;
}

function coerceValue(expected: z.ZodTypeAny, value: string): any {
  const typeName = (expected as any)._def?.typeName as string | undefined;

  // Unwrap optional/nullable wrappers
  if ((expected as any)._def?.innerType) {
    return coerceValue((expected as any)._def.innerType, value);
  }
  if ((expected as any)._def?.schema) {
    return coerceValue((expected as any)._def.schema, value);
  }

  switch (typeName) {
    case "ZodNumber": {
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    }
    case "ZodBoolean": {
      const v = value.toLowerCase();
      if (["1", "true", "yes"].includes(v)) return true;
      if (["0", "false", "no"].includes(v)) return false;
      return undefined;
    }
    case "ZodDate": {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    case "ZodArray": {
      return value;
    }
    default:
      return value;
  }
}

export function parseQuery<TSchema extends AnySchema>(
  schema: TSchema,
  input: string | URLSearchParams,
  options: ParseOptions<TSchema> = {}
): z.infer<TSchema> {
  const sp = typeof input === "string" ? new URLSearchParams(input.startsWith("?") ? input.slice(1) : input) : input;
  const shape: Record<string, z.ZodTypeAny> = (schema as any).shape || {};

  const interim: Record<string, any> = {};
  const entriesByKey = new Map<string, string[]>();
  for (const [k, v] of sp.entries()) {
    if (!entriesByKey.has(k)) entriesByKey.set(k, []);
    entriesByKey.get(k)!.push(v);
  }

  for (const [key, entries] of entriesByKey) {
    const expected = shape[key];
    if (!expected) {
      if (!options.stripUnknown) interim[key] = entries.length > 1 ? entries : entries[0];
      continue;
    }

    const typeName = (expected as any)._def?.typeName as string | undefined;

    if (typeName === "ZodArray") {
      const inner = (expected as any)._def.type as z.ZodTypeAny;
      const fmt = options.arrayKeyFormat?.[key as keyof z.infer<TSchema> & string] || options.arrayFormat || "repeat";
      const ser = resolveArraySerializer(fmt);
      const arr = ser.deserializeArray!(key, entries).map((val) => {
        const s = String(val);
        return options.coerceTypes ? coerceValue(inner, s) : s;
      });
      interim[key] = arr;
      continue;
    }

    const raw = entries[entries.length - 1];
    const val = options.coerceTypes ? coerceValue(expected, raw) : raw;
    interim[key] = val;
  }

  const cleaned = cleanObject(interim, { dropEmpty: options.dropEmpty, trimStrings: options.trimStrings });
  return schema.parse(cleaned);
}

export function buildQuery<TSchema extends AnySchema>(
  schema: TSchema,
  filters: Partial<z.infer<TSchema>>,
  options: BuildOptions<TSchema> = {}
): URLSearchParams {
  const params = new URLSearchParams();
  const shape: Record<string, z.ZodTypeAny> = (schema as any).shape || {};
  const cleaned = cleanObject(filters as any, { dropEmpty: options.dropEmpty, trimStrings: options.trimStrings });

  for (const [key, value] of Object.entries(cleaned)) {
    const expected = shape[key];
    if (!expected) {
      if (!options.stripUnknown && value !== undefined) params.set(key, String(value as any));
      continue;
    }

    const typeName = (expected as any)._def?.typeName as string | undefined;

    if (typeName === "ZodArray" && Array.isArray(value)) {
      const fmt = options.arrayKeyFormat?.[key as keyof z.infer<TSchema> & string] || options.arrayFormat || "repeat";
      const ser = resolveArraySerializer(fmt);
      const items = (value as unknown[]).map(v => v instanceof Date && options.encodeDate ? v.toISOString() : String(v));
      for (const [k, v] of ser.serializeArray!(key, items)) params.append(k, v);
      continue;
    }

    const encoded = value instanceof Date && options.encodeDate ? value.toISOString() : String(value as any);
    params.set(key, encoded);
  }

  return params;
}

export function buildUrl<TSchema extends AnySchema>(
  baseUrl: string,
  schema: TSchema,
  filters: Partial<z.infer<TSchema>>,
  options?: BuildOptions<TSchema>
): string {
  const qs = buildQuery(schema, filters, options).toString();
  if (!qs) return baseUrl;
  const hasQ = baseUrl.includes("?");
  const sep = hasQ ? (baseUrl.endsWith("?") || baseUrl.endsWith("&") ? "" : "&") : "?";
  return `${baseUrl}${sep}${qs}`;
}

export function mergeFilters<TSchema extends AnySchema>(
  current: Partial<z.infer<TSchema>>,
  next: Partial<z.infer<TSchema>>,
  options: { dropEmpty?: boolean } = {}
): Partial<z.infer<TSchema>> {
  const merged = { ...current, ...next } as any;
  return options.dropEmpty ? (cleanObject(merged, { dropEmpty: true }) as any) : merged;
}

export function resetFilters<TSchema extends AnySchema>(
  _schema: TSchema,
  defaults: Partial<z.infer<TSchema>> = {}
): Partial<z.infer<TSchema>> {
  return { ...defaults } as any;
}
