import { z } from "zod";
import type {
  AnySchema,
  BuildOptions,
  CleanOptions,
  ParseOptions,
  DebouncedFunction,
} from "./types";
import { resolveArraySerializer } from "./serializers";

function isEmpty(val: unknown) {
  return (
    val === undefined ||
    val === null ||
    (typeof val === "string" && val.trim() === "")
  );
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay (default: 300ms)
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingResolvers: Array<{
    resolve: (value: ReturnType<T>) => void;
    reject: (error: any) => void;
  }> = [];

  const debounced = ((...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve, reject) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Add this promise to the pending list
      pendingResolvers.push({ resolve, reject });

      // Set new timeout
      timeoutId = setTimeout(() => {
        const resolvers = [...pendingResolvers];
        pendingResolvers = [];
        timeoutId = null;

        try {
          const result = func(...args);
          // Resolve all pending promises with the same result
          resolvers.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          // Reject all pending promises with the same error
          resolvers.forEach(({ reject }) => reject(error));
        }
      }, wait);
    });
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Reject all pending promises
    pendingResolvers.forEach(({ reject }) =>
      reject(new Error("Debounced function was cancelled"))
    );
    pendingResolvers = [];
  };

  debounced.flush = (...args: Parameters<T>) => {
    debounced.cancel();
    return func(...args);
  };

  return debounced;
}

/**
 * Cleans an object by removing empty values and trimming strings
 * @param obj - The object to clean
 * @param opts - Cleaning options
 * @returns A new object with cleaned values
 */
export function cleanObject<T extends Record<string, any>>(
  obj: T,
  opts: CleanOptions = {}
): Partial<T> {
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

function getInnerType(zodType: z.ZodTypeAny): z.ZodTypeAny {
  // Unwrap optional, nullable, and other wrapper types
  if ((zodType as any)._def?.innerType) {
    return getInnerType((zodType as any)._def.innerType);
  }
  if ((zodType as any)._def?.schema) {
    return getInnerType((zodType as any)._def.schema);
  }
  return zodType;
}

function isArrayType(zodType: z.ZodTypeAny): boolean {
  const inner = getInnerType(zodType);
  return (inner as any)._def?.typeName === "ZodArray";
}

function getArrayElementType(zodType: z.ZodTypeAny): z.ZodTypeAny {
  const inner = getInnerType(zodType);
  return (inner as any)._def?.type;
}

function coerceValue(expected: z.ZodTypeAny, value: string): any {
  const inner = getInnerType(expected);
  const typeName = (inner as any)._def?.typeName;

  switch (typeName) {
    case "ZodNumber": {
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    }
    case "ZodBoolean": {
      const v = value.toLowerCase();
      if (["1", "true", "yes"].includes(v)) return true;
      if (["0", "false", "no"].includes(v)) return false;
      return value;
    }
    case "ZodDate": {
      const d = new Date(value);
      return isNaN(d.getTime()) ? value : d;
    }
    case "ZodArray": {
      return value;
    }
    default:
      return value;
  }
}

/**
 * Parses a query string or URLSearchParams into a validated object using a Zod schema
 * @param schema - Zod schema to validate against
 * @param input - Query string or URLSearchParams object
 * @param options - Parsing options
 * @returns Parsed and validated object
 */
export function parseQuery<TSchema extends AnySchema>(
  schema: TSchema,
  input: string | URLSearchParams,
  options: ParseOptions<TSchema> = {}
): z.infer<TSchema> {
  const sp =
    typeof input === "string"
      ? new URLSearchParams(input.startsWith("?") ? input.slice(1) : input)
      : input;
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
      if (!options.stripUnknown)
        interim[key] = entries.length > 1 ? entries : entries[0];
      continue;
    }

    if (isArrayType(expected)) {
      const inner = getArrayElementType(expected);
      const fmt =
        options.arrayKeyFormat?.[key as keyof z.infer<TSchema> & string] ||
        options.arrayFormat ||
        "repeat";
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

  const cleaned = cleanObject(interim, {
    dropEmpty: options.dropEmpty,
    trimStrings: options.trimStrings,
  });
  return schema.parse(cleaned);
}

/**
 * Builds a URLSearchParams object from filters using a Zod schema
 * @param schema - Zod schema for validation
 * @param filters - Filter object to serialize
 * @param options - Build options
 * @returns URLSearchParams object
 */
export function buildQuery<TSchema extends AnySchema>(
  schema: TSchema,
  filters: Partial<z.infer<TSchema>>,
  options: BuildOptions<TSchema> = {}
): URLSearchParams {
  const params = new URLSearchParams();
  const shape: Record<string, z.ZodTypeAny> = (schema as any).shape || {};
  const cleaned = cleanObject(filters as any, {
    dropEmpty: options.dropEmpty,
    trimStrings: options.trimStrings,
  });

  for (const [key, value] of Object.entries(cleaned)) {
    const expected = shape[key];
    if (!expected) {
      if (!options.stripUnknown && value !== undefined)
        params.set(key, String(value as any));
      continue;
    }

    if (isArrayType(expected) && Array.isArray(value)) {
      const fmt =
        options.arrayKeyFormat?.[key as keyof z.infer<TSchema> & string] ||
        options.arrayFormat ||
        "repeat";
      const ser = resolveArraySerializer(fmt);
      const items = (value as unknown[]).map((v) =>
        v instanceof Date && options.encodeDate ? v.toISOString() : String(v)
      );
      for (const [k, v] of ser.serializeArray!(key, items)) params.append(k, v);
      continue;
    }

    const encoded =
      value instanceof Date && options.encodeDate
        ? value.toISOString()
        : String(value as any);
    params.set(key, encoded);
  }

  return params;
}

/**
 * Builds a complete URL with query parameters from filters
 * @param baseUrl - Base URL (e.g., "/products")
 * @param schema - Zod schema for validation
 * @param filters - Filter object to serialize
 * @param options - Build options
 * @returns Complete URL with query parameters
 */
export function buildUrl<TSchema extends AnySchema>(
  baseUrl: string,
  schema: TSchema,
  filters: Partial<z.infer<TSchema>>,
  options?: BuildOptions<TSchema>
): string {
  const qs = buildQuery(schema, filters, options).toString();
  if (!qs) return baseUrl;
  const hasQ = baseUrl.includes("?");
  const sep = hasQ
    ? baseUrl.endsWith("?") || baseUrl.endsWith("&")
      ? ""
      : "&"
    : "?";
  return `${baseUrl}${sep}${qs}`;
}

/**
 * Merges two filter objects, with the second taking precedence
 * @param current - Current filter values
 * @param next - New filter values to merge
 * @param options - Merge options
 * @returns Merged filter object
 */
export function mergeFilters<TSchema extends AnySchema>(
  current: Partial<z.infer<TSchema>>,
  next: Partial<z.infer<TSchema>>,
  options: { dropEmpty?: boolean } = {}
): Partial<z.infer<TSchema>> {
  const merged = { ...current, ...next } as any;
  return options.dropEmpty
    ? (cleanObject(merged, { dropEmpty: true }) as any)
    : merged;
}

/**
 * Resets filters to default values
 * @param _schema - Zod schema (for type inference)
 * @param defaults - Default values to use
 * @returns Reset filter object
 */
export function resetFilters<TSchema extends AnySchema>(
  _schema: TSchema,
  defaults: Partial<z.infer<TSchema>> = {}
): Partial<z.infer<TSchema>> {
  return { ...defaults } as any;
}

/**
 * Creates a debounced version of parseQuery with 300ms delay
 * @param schema - Zod schema to validate against
 * @param wait - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced parseQuery function
 */
export function createDebouncedParseQuery<TSchema extends AnySchema>(
  schema: TSchema,
  wait: number = 300
) {
  return debounce(
    (input: string | URLSearchParams, options?: ParseOptions<TSchema>) =>
      parseQuery(schema, input, options),
    wait
  );
}

/**
 * Creates a debounced version of buildUrl with 300ms delay
 * @param schema - Zod schema for validation
 * @param wait - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced buildUrl function
 */
export function createDebouncedBuildUrl<TSchema extends AnySchema>(
  schema: TSchema,
  wait: number = 300
) {
  return debounce(
    (
      baseUrl: string,
      filters: Partial<z.infer<TSchema>>,
      options?: BuildOptions<TSchema>
    ) => buildUrl(baseUrl, schema, filters, options),
    wait
  );
}

/**
 * Creates a debounced version of buildQuery with 300ms delay
 * @param schema - Zod schema for validation
 * @param wait - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced buildQuery function
 */
export function createDebouncedBuildQuery<TSchema extends AnySchema>(
  schema: TSchema,
  wait: number = 300
) {
  return debounce(
    (filters: Partial<z.infer<TSchema>>, options?: BuildOptions<TSchema>) =>
      buildQuery(schema, filters, options),
    wait
  );
}
