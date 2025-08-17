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
