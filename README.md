# 🔍 filters-query-params

Type-safe URL query parameter management for React, Next.js, and vanilla TypeScript with Zod validation.

[![npm version](https://img.shields.io/npm/v/filters-query-params.svg)](https://npmjs.com/package/filters-query-params)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## ✨ Features

- 🛡️ **Type-safe** with Zod schema validation
- 🔄 **Smart type coercion** (string → number/boolean/date)
- 🧹 **Data cleaning**: drop empty values, trim strings, strip unknown keys
- 📦 **Multiple array formats**: repeat (`?tags=a&tags=b`), comma (`?tags=a,b`), JSON
- 📅 **Date handling** with ISO encoding/decoding
- ⚛️ **React hooks** for seamless integration
- 🚀 **Next.js support** (App Router & Pages Router)
- 🧭 **React Router** compatibility
- 🏭 **SSR-ready** with server-side helpers
- 📝 **ESM + CJS** with full TypeScript definitions

## 📦 Installation

```bash
npm install filters-query-params zod
```

## 🚀 Quick Start

### 1. Define Your Schema

```typescript
import { z } from "zod";

const productFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(["price", "rating", "newest"]).optional(),
  createdAfter: z.date().optional(),
});
```

### 2. Use in React Components

#### Next.js App Router

```typescript
"use client";
import { useNextAppFilters } from "filters-query-params";
import { productFiltersSchema } from "./schema";

export default function ProductsPage() {
  const { filters, setFilters, reset } =
    useNextAppFilters(productFiltersSchema);

  return (
    <div>
      <input
        value={filters.search || ""}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search products..."
      />

      <select
        value={filters.category || ""}
        onChange={(e) => setFilters({ category: e.target.value })}
      >
        <option value="">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="clothing">Clothing</option>
      </select>

      <button onClick={() => reset()}>Clear Filters</button>

      <pre>{JSON.stringify(filters, null, 2)}</pre>
    </div>
  );
}
```

#### Next.js Pages Router

```typescript
import { useNextPagesFilters } from "filters-query-params";
import { productFiltersSchema } from "./schema";

export default function ProductsPage() {
  const { filters, setFilters, reset } =
    useNextPagesFilters(productFiltersSchema);

  // Same component code as above...
}
```

#### React Router

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
