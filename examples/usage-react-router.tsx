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
