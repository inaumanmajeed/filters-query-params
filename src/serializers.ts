import { ArrayFormat, Serializer } from "./types";

/** Serializer for repeat format: ?tags=a&tags=b&tags=c */
export const repeatSerializer: Serializer = {
  serializeArray: (key, values) => values.map((v) => [key, String(v)]),
  deserializeArray: (_key, entries) => entries,
};

/** Serializer for comma format: ?tags=a,b,c */
export const commaSerializer: Serializer = {
  serializeArray: (key, values) => [[key, values.join(",")]],
  deserializeArray: (_key, entries) =>
    entries[0] ? entries[0].split(",") : [],
};

/** Serializer for JSON format: ?tags=["a","b","c"] */
export const jsonSerializer: Serializer = {
  serializeArray: (key, values) => [[key, JSON.stringify(values)]],
  deserializeArray: (_key, entries) => {
    try {
      return JSON.parse(entries[0] ?? "[]");
    } catch {
      return [];
    }
  },
};

/**
 * Resolves a serializer based on the array format
 * @param fmt - Array format to use
 * @returns Appropriate serializer
 */
export function resolveArraySerializer(fmt?: ArrayFormat): Serializer {
  switch (fmt) {
    case "json":
      return jsonSerializer;
    case "comma":
      return commaSerializer;
    case "repeat":
    default:
      return repeatSerializer;
  }
}
