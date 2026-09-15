import { z } from "zod";
export const PaginationQuerySchema = z.object({ cursor: z.string().min(1).optional(), limit: z.coerce.number().int().min(1).max(100).default(20), sort: z.enum(["asc", "desc"]).default("asc") });
export const PageInfoSchema = z.object({ nextCursor: z.string().nullable(), hasNextPage: z.boolean() });
export function PaginatedResponseSchema<T extends z.ZodType>(item: T) { return z.object({ data: z.array(item), page: PageInfoSchema }); }
