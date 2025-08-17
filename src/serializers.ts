import { ArrayFormat, Serializer } from "./types";

export const repeatSerializer: Serializer = {
  serializeArray: (key, values) => values.map(v => [key, String(v)]),
  deserializeArray: (_key, entries) => entries
};

export const commaSerializer: Serializer = {
  serializeArray: (key, values) => [[key, values.join(",")]],
  deserializeArray: (_key, entries) => (entries[0] ? entries[0].split(",") : [])
};

export const jsonSerializer: Serializer = {
  serializeArray: (key, values) => [[key, JSON.stringify(values)]],
  deserializeArray: (_key, entries) => {
    try { return JSON.parse(entries[0] ?? "[]"); } catch { return []; }
  }
};

export function resolveArraySerializer(fmt?: ArrayFormat): Serializer {
  switch (fmt) {
    case "json": return jsonSerializer;
    case "comma": return commaSerializer;
    case "repeat":
    default: return repeatSerializer;
  }
}
