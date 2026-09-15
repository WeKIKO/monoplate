import { z } from "zod";

export const JsonContentTypeHeaderSchema = z.object({
  "content-type": z.string().regex(/^application\/json(?:\s*;.*)?$/i, "content-type must be application/json"),
});
