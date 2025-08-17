import type { z } from "zod";

export type Primitive = string | number | boolean | null | undefined | Date;
export type ArrayFormat = "repeat" | "comma" | "json";

export type Serializer = {
  serializeArray?: (key: string, values: unknown[]) => [string, string][];
  deserializeArray?: (key: string, entries: string[]) => unknown[];
};

export interface ParseOptions<TSchema extends z.ZodTypeAny> {
  stripUnknown?: boolean;
  trimStrings?: boolean;
  dropEmpty?: boolean;
  coerceTypes?: boolean;
  arrayFormat?: ArrayFormat;
  arrayKeyFormat?: Partial<Record<keyof z.infer<TSchema> & string, ArrayFormat>>;
}

export interface BuildOptions<TSchema extends z.ZodTypeAny>
  extends Omit<ParseOptions<TSchema>, "coerceTypes"> {
  encodeDate?: boolean;
}

export interface CleanOptions {
  dropEmpty?: boolean;
  trimStrings?: boolean;
}

export type AnySchema = z.ZodTypeAny;
