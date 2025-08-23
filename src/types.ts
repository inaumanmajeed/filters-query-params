import type { z } from "zod";

export type Primitive = string | number | boolean | null | undefined | Date;

/** Supported array serialization formats */
export type ArrayFormat = "repeat" | "comma" | "json";

/** Interface for array serialization/deserialization */
export type Serializer = {
  serializeArray?: (key: string, values: unknown[]) => [string, string][];
  deserializeArray?: (key: string, entries: string[]) => unknown[];
};

/** Options for parsing query parameters */
export interface ParseOptions<TSchema extends z.ZodTypeAny> {
  /** Remove keys not defined in the schema */
  stripUnknown?: boolean;
  /** Trim whitespace from string values */
  trimStrings?: boolean;
  /** Remove empty, null, or undefined values */
  dropEmpty?: boolean;
  /** Convert strings to appropriate types (number, boolean, date) */
  coerceTypes?: boolean;
  /** Default array format for all array fields */
  arrayFormat?: ArrayFormat;
  /** Per-field array format overrides */
  arrayKeyFormat?: Partial<
    Record<keyof z.infer<TSchema> & string, ArrayFormat>
  >;
}

/** Options for building query parameters */
export interface BuildOptions<TSchema extends z.ZodTypeAny>
  extends Omit<ParseOptions<TSchema>, "coerceTypes"> {
  /** Encode Date objects as ISO strings */
  encodeDate?: boolean;
}

/** Options for cleaning objects */
export interface CleanOptions {
  /** Remove empty, null, or undefined values */
  dropEmpty?: boolean;
  /** Trim whitespace from string values */
  trimStrings?: boolean;
}

/** Any Zod schema type */
export type AnySchema = z.ZodTypeAny;

/** Debounced function type with cancel and flush methods */
export interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): Promise<ReturnType<T>>;
  cancel(): void;
  flush(...args: Parameters<T>): ReturnType<T>;
}
