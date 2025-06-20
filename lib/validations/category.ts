import { z } from "zod"

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
