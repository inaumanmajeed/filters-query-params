import { buildUrl, parseQuery } from "filters-query-params";
import { productFilterSchema } from "./schema";

export function Example() {
  const filters = parseQuery(productFilterSchema, window.location.search, {
    coerceTypes: true,
    arrayFormat: "repeat"
  });
  const apiUrl = buildUrl("/api/products", productFilterSchema, filters, { arrayFormat: "repeat" });
  console.log("apiUrl", apiUrl);
  return null;
}
