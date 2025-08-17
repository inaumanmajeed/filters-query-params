# filters-query-params

Type-safe filter/query param helpers using **Zod**. Works in **React**, **Next.js (App & Pages Router)** and **React Router v6**.

## ✨ Features
- Zod-validated parsing with optional **type coercion** (number/boolean/date)
- Cleaners: **drop empty/undefined/null**, **trim strings**, **strip unknown keys**
- Build **query strings/URLs** from objects
- Arrays: **repeat** (`?tags=a&tags=b`), **comma** (`?tags=a,b`), or **JSON**
- Dates: **ISO** encoding/decoding
- SSR helpers for **Next.js**
- Hooks: `useNextAppFilters`, `useNextPagesFilters`, `useReactRouterFilters`
- Utilities: `mergeFilters`, `resetFilters`, `cleanObject`
- ESM + CJS + d.ts with **tsup**

## 📦 Install
```bash
npm i filters-query-params zod
```

## 🧪 Quick Schema
```ts
import { z } from "zod";

export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().min(0).optional(),
  inStock: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  sortBy: z.enum(["price", "rating", "newest"]).optional(),
  createdAfter: z.date().optional()
});
```

## 🔁 Build/Parse
```ts
import { buildUrl, parseQuery } from "filters-query-params";
import { productFilterSchema } from "./schema";

// Build URL
const url = buildUrl("/products", productFilterSchema, {
  search: "sneakers",
  tags: ["eco", "sale"],
  createdAfter: new Date()
}, { arrayFormat: "repeat", encodeDate: true });

// Parse from location
const filters = parseQuery(productFilterSchema, window.location.search, {
  coerceTypes: true,
  arrayFormat: "repeat"
});
```

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
```

## 🧭 React Router v6 Hook
```tsx
import { productFilterSchema } from "./schema";
import { useReactRouterFilters } from "filters-query-params";

export function Catalog() {
  const { filters, setFilters, reset } = useReactRouterFilters(productFilterSchema);

  return (
    <div>
      <select value={filters.sortBy ?? "price"} onChange={(e) => setFilters({ sortBy: e.target.value as any })}>
        <option value="price">Price</option>
        <option value="rating">Rating</option>
        <option value="newest">Newest</option>
      </select>
      <button onClick={() => reset({ sortBy: "newest" })}>Reset to defaults</button>
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
