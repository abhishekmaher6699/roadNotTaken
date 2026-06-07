import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

type ValidationSchemas = Partial<Record<RequestPart, ZodType>>;

function formatValidationDetails(error: { issues: Array<{ path: PropertyKey[]; message: string }> }) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

function assignRequestPart(req: Request, part: RequestPart, data: unknown) {
  if (part === "query") {
    Object.defineProperty(req, "query", {
      value: data,
      configurable: true,
      enumerable: true,
    });
    return;
  }

  (req as unknown as Record<RequestPart, unknown>)[part] = data;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const [part, schema] of Object.entries(schemas) as Array<
      [RequestPart, ZodType]
    >) {
      const result = schema.safeParse(req[part]);

      if (!result.success) {
        return res.status(400).json({
          error: result.error.issues[0]?.message ?? "Validation failed",
          details: formatValidationDetails(result.error),
        });
      }

      assignRequestPart(req, part, result.data);
    }

    return next();
  };
}
