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
