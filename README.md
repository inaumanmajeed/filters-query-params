# 🔍 filters-query-params

Type-safe URL query parameter management for React, Next.js, and vanilla TypeScript with Zod validation.

[![npm version](https://img.shields.io/npm/v/filters-query-params.svg)](https://npmjs.com/package/filters-query-params)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## ✨ Features

- 🛡️ **Type-safe** with Zod schema validation
- 🔄 **Smart type coercion** (string → number/boolean/date)
- 🧹 **Data cleaning** (drop empty values, trim strings, strip unknown keys)
- 📦 **Multiple array formats** (repeat, comma, JSON)
- 📅 **Date handling** with ISO encoding/decoding
- ⚡ **Debouncing** with 300ms default delay
- ⚛️ **React hooks** for Next.js (App/Pages Router) and React Router
- 🚀 **SSR-ready** with server-side helpers
- 📝 **ESM + CJS** with full TypeScript definitions

## 📦 Installation

```bash
npm install filters-query-params zod
```

## 🚀 Quick Start

### 1. Define Your Schema

```typescript
import { z } from "zod";

const filtersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  createdAfter: z.date().optional(),
});
```

### 2. Core Usage

#### Parse Query Strings

```typescript
import { parseQuery } from "filters-query-params";

const filters = parseQuery(filtersSchema, "?search=laptop&priceMin=100", {
  coerceTypes: true, // Convert strings to proper types
  dropEmpty: true, // Remove empty values
  arrayFormat: "repeat", // Handle ?tags=a&tags=b
});
// Result: { search: "laptop", priceMin: 100 }
```

#### Build URLs

```typescript
import { buildUrl, buildQuery } from "filters-query-params";

const url = buildUrl(
  "/products",
  filtersSchema,
  {
    search: "laptop",
    tags: ["gaming", "portable"],
  },
  { arrayFormat: "repeat" }
);
// Result: "/products?search=laptop&tags=gaming&tags=portable"

const queryParams = buildQuery(filtersSchema, { search: "laptop" });
// Result: URLSearchParams object
```

### 3. React Hooks

#### Next.js App Router

```typescript
"use client";
import { useNextAppFilters } from "filters-query-params";

export default function ProductsPage() {
  const { filters, setFilters, reset, isLoading } =
    useNextAppFilters(filtersSchema);

  return (
    <div>
      <input
        value={filters.search || ""}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search..."
      />
      <button onClick={() => setFilters({ inStock: true })}>
        In Stock Only
      </button>
      <button onClick={() => reset()}>Clear All</button>
    </div>
  );
}
```

#### Next.js Pages Router

```typescript
import { useNextPagesFilters } from "filters-query-params";

export default function ProductsPage() {
  const { filters, setFilters, reset } = useNextPagesFilters(filtersSchema);
  // Same usage as App Router
}
```

#### React Router

```typescript
import { useReactRouterFilters } from "filters-query-params";

export function ProductsPage() {
  const { filters, setFilters, reset } = useReactRouterFilters(filtersSchema);
  // Same usage as Next.js
}
```

### 4. Utility Functions

```typescript
import { cleanObject, mergeFilters, resetFilters } from "filters-query-params";

// Clean data
const clean = cleanObject(
  { name: " John ", age: "", active: true },
  { trimStrings: true, dropEmpty: true }
);
// Result: { name: "John", active: true }

// Merge filters
const merged = mergeFilters({ search: "old" }, { category: "new" });
// Result: { search: "old", category: "new" }

// Reset to defaults
const reset = resetFilters(filtersSchema, { category: "electronics" });
// Result: { category: "electronics" }
```

### 5. Server-Side Rendering

```typescript
import { getFiltersFromUrl, getFiltersFromSearch } from "filters-query-params";

// From full URL
const filters = getFiltersFromUrl(filtersSchema, req.url, {
  coerceTypes: true,
});

// From search params only
const filters2 = getFiltersFromSearch(filtersSchema, "?search=laptop&page=1");
```

## 📖 API Reference

### Core Functions

| Function                                       | Purpose                            | Example                                |
| ---------------------------------------------- | ---------------------------------- | -------------------------------------- |
| `parseQuery(schema, input, options?)`          | Parse query string to typed object | `parseQuery(schema, "?q=test")`        |
| `buildQuery(schema, filters, options?)`        | Build URLSearchParams from object  | `buildQuery(schema, { q: "test" })`    |
| `buildUrl(baseUrl, schema, filters, options?)` | Build complete URL with params     | `buildUrl("/search", schema, filters)` |
| `cleanObject(obj, options?)`                   | Clean object (trim, drop empty)    | `cleanObject({ name: " John " })`      |
| `mergeFilters(current, next, options?)`        | Merge filter objects               | `mergeFilters(old, new)`               |
| `resetFilters(schema, defaults?)`              | Reset to default values            | `resetFilters(schema, { page: 1 })`    |

### React Hooks

| Hook                                      | Framework            | Purpose                      |
| ----------------------------------------- | -------------------- | ---------------------------- |
| `useNextAppFilters(schema, options?)`     | Next.js App Router   | Manage filters with URL sync |
| `useNextPagesFilters(schema, options?)`   | Next.js Pages Router | Manage filters with URL sync |
| `useReactRouterFilters(schema, options?)` | React Router         | Manage filters with URL sync |

### Debouncing Functions

| Function                                    | Purpose                  | Example                             |
| ------------------------------------------- | ------------------------ | ----------------------------------- |
| `debounce(fn, delay?)`                      | Debounce any function    | `debounce(searchFn, 300)`           |
| `createDebouncedParseQuery(schema, delay?)` | Debounced query parsing  | `createDebouncedParseQuery(schema)` |
| `createDebouncedBuildUrl(schema, delay?)`   | Debounced URL building   | `createDebouncedBuildUrl(schema)`   |
| `createDebouncedBuildQuery(schema, delay?)` | Debounced query building | `createDebouncedBuildQuery(schema)` |

### SSR Helpers

| Function                                         | Purpose                            | Example                                   |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------- |
| `getFiltersFromUrl(schema, url, options?)`       | Extract filters from full URL      | `getFiltersFromUrl(schema, req.url)`      |
| `getFiltersFromSearch(schema, search, options?)` | Extract filters from search params | `getFiltersFromSearch(schema, "?q=test")` |

## ⚙️ Configuration

### Array Formats

| Format     | URL Example       | Use Case                 |
| ---------- | ----------------- | ------------------------ |
| `"repeat"` | `?tags=a&tags=b`  | Most compatible, default |
| `"comma"`  | `?tags=a,b`       | Shorter URLs             |
| `"json"`   | `?tags=["a","b"]` | Complex data structures  |

### Options

#### ParseOptions & BuildOptions

```typescript
{
  stripUnknown?: boolean;     // Remove unknown keys
  trimStrings?: boolean;      // Trim whitespace
  dropEmpty?: boolean;        // Remove empty values
  coerceTypes?: boolean;      // Convert string types (parse only)
  arrayFormat?: ArrayFormat;  // Array serialization format
  arrayKeyFormat?: Record<string, ArrayFormat>; // Per-key formats
  encodeDate?: boolean;       // Encode dates as ISO strings (build only)
}
```

## � Advanced Usage

### Debouncing

```typescript
import { debounce, createDebouncedParseQuery } from "filters-query-params";

// Debounce any function
const debouncedSearch = debounce(async (query: string) => {
  return fetch(`/api/search?q=${query}`);
}, 300);

// Debounced query parsing
const debouncedParseQuery = createDebouncedParseQuery(filtersSchema, 300);
debouncedParseQuery("?search=laptop");
debouncedParseQuery("?search=macbook"); // Only this executes after 300ms

// Cancel or flush immediately
debouncedParseQuery.cancel();
const immediate = debouncedParseQuery.flush("?search=immediate");
```

### Date Handling

```typescript
const url = buildUrl(
  "/events",
  schema,
  {
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
  },
  { encodeDate: true }
);

// Parses dates back from ISO strings
const filters = parseQuery(schema, url, { coerceTypes: true });
console.log(filters.startDate instanceof Date); // true
```

### Data Cleaning

```typescript
const filters = parseQuery(schema, "?search=  hello  &category=&priceMin=0", {
  trimStrings: true, // "  hello  " → "hello"
  dropEmpty: true, // Remove category=""
  coerceTypes: true, // "0" → 0
});
// Result: { search: "hello", priceMin: 0 }
```

### Mixed Array Formats

```typescript
const { filters } = useNextAppFilters(schema, {
  build: {
    arrayFormat: "repeat", // default for most arrays
    arrayKeyFormat: {
      tags: "comma", // use comma for tags specifically
      categories: "json", // use JSON for categories
    },
  },
});
```

## � Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

Copyright © 2025 [Nauman Majeed](https://github.com/inaumanmajeed)
