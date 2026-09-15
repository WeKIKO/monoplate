import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string().optional(),
  details: z.unknown().optional(),
});

export const ErrorResponseSchema = z.object({ error: ApiErrorSchema });

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export const errorCodes = ["VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "FORBIDDEN", "CONFLICT", "RATE_LIMITED", "PAYLOAD_TOO_LARGE", "REQUEST_TIMEOUT", "INTERNAL_ERROR"] as const;
export type ErrorCode = typeof errorCodes[number];
