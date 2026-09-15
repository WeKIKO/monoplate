import { ErrorResponseSchema } from "@monoplate/contracts/error";
import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { ZodType } from "zod";
import type { PublicUser } from "@monoplate/auth";
export type ApiEnvironment = { Variables: { requestId: string; authUser: PublicUser } };

export function createApiRouter() {
  return new OpenAPIHono<ApiEnvironment>({
    defaultHook: (result, context) => {
      if (result.success) return;

      return context.json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          requestId: context.get("requestId"),
          details: result.error.flatten(),
        },
      }, 400);
    },
  });
}

export { createRoute };

export function jsonContent(schema: ZodType, description: string) {
  return {
    description,
    content: { "application/json": { schema } },
  } as const;
}

export const standardErrorResponses = {
  400: jsonContent(ErrorResponseSchema, "Invalid request"),
  404: jsonContent(ErrorResponseSchema, "Resource not found"),
  401: jsonContent(ErrorResponseSchema, "Authentication required"),
  403: jsonContent(ErrorResponseSchema, "Permission denied"),
  500: jsonContent(ErrorResponseSchema, "Internal server error"),
} as const;
