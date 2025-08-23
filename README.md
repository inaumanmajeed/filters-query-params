# 🔍 filters-query-params

Type-safe URL query parameter management for React, Next.js, and vanilla TypeScript with Zod validation.

[![npm version](https://img.shields.io/npm/v/filters-query-params.svg)](https://npmjs.com/package/filters-query-params)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## 🛠️ Technologies & Features

- **🛡️ Type-safe** with Zod schema validation
- **🔄 Smart type coercion** (string → number/boolean/date)
- **🧹 Data cleaning** (drop empty values, trim strings, strip unknown keys)
- **📦 Multiple array formats** (repeat, comma, JSON)
- **📅 Date handling** with ISO encoding/decoding
- **⚡ Debouncing** with 300ms default delay
- **⚛️ React hooks** for Next.js (App/Pages Router) and React Router
- **🚀 SSR-ready** with server-side helpers
- **📝 ESM + CJS** with full TypeScript definitions

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

### 2. Core Functions

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

#### Utility Functions

```typescript
import { cleanObject, mergeFilters, resetFilters } from "filters-query-params";

// Clean data
const clean = cleanObject(
  { name: " John ", age: "", active: true },
  {
    trimStrings: true,
    dropEmpty: true,
  }
);
// Result: { name: "John", active: true }

// Merge filters
const merged = mergeFilters({ search: "old" }, { category: "new" });
// Result: { search: "old", category: "new" }

// Reset to defaults
const reset = resetFilters(filtersSchema, { category: "electronics" });
// Result: { category: "electronics" }
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

### 4. Debouncing (Performance Optimization)

```typescript
import { debounce, createDebouncedParseQuery } from "filters-query-params";

// Debounce any function with 300ms delay
const debouncedSearch = debounce(async (query: string) => {
  return fetch(`/api/search?q=${query}`);
}, 300);

// Debounced query parsing
const debouncedParseQuery = createDebouncedParseQuery(filtersSchema, 300);

// Multiple rapid calls - only the last one executes
debouncedParseQuery("?search=laptop");
debouncedParseQuery("?search=macbook"); // Only this will execute after 300ms

// Cancel or flush immediately
debouncedParseQuery.cancel();
const immediate = debouncedParseQuery.flush("?search=immediate");
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

### Debouncing Functions

| Function                                    | Purpose                  | Example                             |
| ------------------------------------------- | ------------------------ | ----------------------------------- |
| `debounce(fn, delay?)`                      | Debounce any function    | `debounce(searchFn, 300)`           |
| `createDebouncedParseQuery(schema, delay?)` | Debounced query parsing  | `createDebouncedParseQuery(schema)` |
| `createDebouncedBuildUrl(schema, delay?)`   | Debounced URL building   | `createDebouncedBuildUrl(schema)`   |
| `createDebouncedBuildQuery(schema, delay?)` | Debounced query building | `createDebouncedBuildQuery(schema)` |

### React Hooks

| Hook                                                            | Framework            | Purpose                      |
| --------------------------------------------------------------- | -------------------- | ---------------------------- |
| `useNextAppFilters(schema, options?)`                           | Next.js App Router   | Manage filters with URL sync |
| `useNextPagesFilters(schema, options?)`                         | Next.js Pages Router | Manage filters with URL sync |
| `useReactRouterFilters(schema, options?)`                       | React Router         | Manage filters with URL sync |
| `useFiltersGeneric(getCurrentUrl, updateUrl, schema, options?)` | Generic              | Custom URL management        |

### SSR Helpers

| Function                                         | Purpose                            | Example                                   |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------- |
| `getFiltersFromUrl(schema, url, options?)`       | Extract filters from full URL      | `getFiltersFromUrl(schema, req.url)`      |
| `getFiltersFromSearch(schema, search, options?)` | Extract filters from search params | `getFiltersFromSearch(schema, "?q=test")` |

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

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

Copyright (c) 2025 [Nauman Majeed](https://github.com/inaumanmajeed)

```typescript
import { useReactRouterFilters } from "filters-query-params";
import { productFiltersSchema } from "./schema";

export default function ProductsPage() {
  const { filters, setFilters, reset } =
    useReactRouterFilters(productFiltersSchema);

  // Same component code as above...
}
```

### 3. Manual URL Building & Parsing

```typescript
import { buildUrl, parseQuery, buildQuery } from "filters-query-params";
import { productFiltersSchema } from "./schema";

// Build URL from filters
const url = buildUrl(
  "/products",
  productFiltersSchema,
  {
    search: "sneakers",
    tags: ["eco", "sale"],
    priceMin: 50,
    priceMax: 200,
    inStock: true,
    createdAfter: new Date("2024-01-01"),
  },
  {
    arrayFormat: "repeat",
    encodeDate: true,
  }
);
// Result: /products?search=sneakers&tags=eco&tags=sale&priceMin=50&priceMax=200&inStock=true&createdAfter=2024-01-01T00%3A00%3A00.000Z

// Parse query string
const filters = parseQuery(
  productFiltersSchema,
  "?search=shoes&priceMin=100&inStock=true",
  {
    coerceTypes: true,
    dropEmpty: true,
    trimStrings: true,
  }
);
// Result: { search: "shoes", priceMin: 100, inStock: true }

// Build query string only
const queryParams = buildQuery(productFiltersSchema, {
  search: "shoes",
  tags: ["new"],
});
console.log(queryParams.toString()); // "search=shoes&tags=new"
```

## 🔧 API Reference

### Core Functions

#### `parseQuery(schema, input, options?)`

Parses a query string or URLSearchParams into a validated object.

```typescript
parseQuery(
  schema: ZodSchema,
  input: string | URLSearchParams,
  options?: ParseOptions
)
```

**Options:**

- `coerceTypes?: boolean` - Convert strings to numbers/booleans/dates (default: false)
- `dropEmpty?: boolean` - Remove empty/null/undefined values (default: false)
- `trimStrings?: boolean` - Trim whitespace from strings (default: false)
- `stripUnknown?: boolean` - Remove keys not in schema (default: false)
- `arrayFormat?: "repeat" | "comma" | "json"` - Array parsing format (default: "repeat")
- `arrayKeyFormat?: Record<string, ArrayFormat>` - Per-key array formats

#### `buildQuery(schema, filters, options?)`

Builds a URLSearchParams object from filters.

```typescript
buildQuery(
  schema: ZodSchema,
  filters: Partial<SchemaType>,
  options?: BuildOptions
)
```

#### `buildUrl(baseUrl, schema, filters, options?)`

Builds a complete URL with query parameters.

```typescript
buildUrl(
  baseUrl: string,
  schema: ZodSchema,
  filters: Partial<SchemaType>,
  options?: BuildOptions
)
```

**Build Options:**

- `dropEmpty?: boolean` - Skip empty values
- `trimStrings?: boolean` - Trim strings before encoding
- `stripUnknown?: boolean` - Skip unknown keys
- `encodeDate?: boolean` - Encode dates as ISO strings (default: false)
- `arrayFormat?: "repeat" | "comma" | "json"` - Array serialization format
- `arrayKeyFormat?: Record<string, ArrayFormat>` - Per-key array formats

### React Hooks

#### `useNextAppFilters(schema, options?)`

For Next.js App Router (`useSearchParams` + `useRouter`).

#### `useNextPagesFilters(schema, options?)`

For Next.js Pages Router (`useRouter` from `next/router`).

#### `useReactRouterFilters(schema, options?)`

For React Router v6 (`useLocation` + `useNavigate`).

**Hook Options:**

- `parse?: ParseOptions` - Options for parsing URL params
- `build?: BuildOptions` - Options for building URLs
- `basePath?: string` - Base path for URLs (auto-detected)

**Returns:**

- `filters` - Current parsed filters
- `setFilters(newFilters)` - Merge new filters and update URL
- `reset(defaults?)` - Clear filters (optionally set defaults)

### Utility Functions

#### `mergeFilters(current, next, options?)`

Merges two filter objects.

```typescript
const merged = mergeFilters(
  { search: "shoes", priceMin: 50 },
  { priceMax: 200, search: "boots" },
  { dropEmpty: true }
);
// Result: { search: "boots", priceMin: 50, priceMax: 200 }
```

#### `resetFilters(schema, defaults?)`

Resets filters to defaults.

```typescript
const reset = resetFilters(schema, { sortBy: "newest" });
```

#### `cleanObject(object, options?)`

Cleans an object by removing empty values and trimming strings.

```typescript
const cleaned = cleanObject(
  { name: "  John  ", age: "", city: null },
  { dropEmpty: true, trimStrings: true }
);
// Result: { name: "John" }
```

### Server-Side Helpers (Next.js)

#### `getFiltersFromUrl(schema, fullUrl, options?)`

Parse filters from a complete URL (useful in API routes).

```typescript
// In API route or server component
const filters = getFiltersFromUrl(
  productFiltersSchema,
  "https://example.com/products?search=shoes&priceMin=100",
  { coerceTypes: true }
);
```

#### `getFiltersFromSearch(schema, searchString, options?)`

Parse filters from a search string.

```typescript
const filters = getFiltersFromSearch(
  productFiltersSchema,
  "?search=shoes&priceMin=100",
  { coerceTypes: true }
);
```

## 🎯 Array Formats

### Repeat Format (Default)

```
?tags=eco&tags=sale&tags=new
```

### Comma Format

```
?tags=eco,sale,new
```

### JSON Format

```
?tags=["eco","sale","new"]
```

### Mixed Formats

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

## 📅 Date Handling

Dates are automatically encoded/decoded as ISO strings when `encodeDate: true`:

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

## 🧹 Data Cleaning

The library provides automatic data cleaning:

```typescript
const filters = parseQuery(schema, "?search=  hello  &category=&priceMin=0", {
  trimStrings: true, // "  hello  " → "hello"
  dropEmpty: true, // Remove category=""
  coerceTypes: true, // "0" → 0
});
// Result: { search: "hello", priceMin: 0 }
```

## 🎨 TypeScript Support

Full TypeScript support with proper type inference:

```typescript
const schema = z.object({
  search: z.string().optional(),
  price: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const { filters, setFilters } = useNextAppFilters(schema);

// filters is typed as:
// {
//   search?: string;
//   price?: number;
//   tags?: string[];
// }

setFilters({
  search: "hello", // ✅
  price: 42, // ✅
  invalid: "key", // ❌ TypeScript error
});
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT © [Nauman Majeed](https://github.com/inaumanmajeed)
const filters = parseQuery(productFilterSchema, window.location.search, {
coerceTypes: true,
arrayFormat: "repeat"
});

````

## 🧩 Next.js (App Router) Hook
```tsx
"use client";
import { productFilterSchema } from "./schema";
import { useNextAppFilters } from "filters-query-params";

export default function ProductsPage() {
  const { filters, setFilters, reset } = useNextAppFilters(productFilterSchema, {
    build: { arrayFormat: "repeat", encodeDate: true },
    parse: { arrayFormat: "repeat", coerceTypes: true }
  });

  return (
    <div>
      <input
        value={filters.search ?? ""}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search products"
      />
      <button onClick={() => setFilters({ inStock: true })}>In stock</button>
      <button onClick={() => setFilters({ tags: ["eco", "sale"] })}>Tags</button>
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
}
````

## 🧭 React Router v6 Hook

```tsx
import { productFilterSchema } from "./schema";
import { useReactRouterFilters } from "filters-query-params";

export function Catalog() {
  const { filters, setFilters, reset } =
    useReactRouterFilters(productFilterSchema);

  return (
    <div>
      <select
        value={filters.sortBy ?? "price"}
        onChange={(e) => setFilters({ sortBy: e.target.value as any })}
      >
        <option value="price">Price</option>
        <option value="rating">Rating</option>
        <option value="newest">Newest</option>
      </select>
      <button onClick={() => reset({ sortBy: "newest" })}>
        Reset to defaults
      </button>
    </div>
  );
}
```

## 🧪 Tests

Run all tests:

```bash
npm test
```

## 🛠 VS Code Dev

1. Open the folder in VS Code.
2. Install deps: `npm install`
3. Build library: `npm run build` (or `npm run dev` for watch)
4. Run tests: `npm test` or `npm run test:watch`
5. Try locally in another app:
   ```bash
   npm link
   cd ../your-app
   npm link filters-query-params
   ```

## 🧰 SSR Helpers

```ts
import { getFiltersFromUrl } from "filters-query-params";
const filters = getFiltersFromUrl(schema, req.url);
```

## 📜 License

MIT

# react-next-filters
