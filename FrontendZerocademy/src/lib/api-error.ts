import { localizeApiMessage } from "@/lib/localize-api-message";

export interface ApiErrorDetail {
  field: string;
  message: string | string[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string | { message: string; conflicts?: unknown[] };
  error: string;
  details?: ApiErrorDetail[];
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly details?: ApiErrorDetail[];
  readonly conflicts?: unknown[];

  constructor(body: ApiErrorBody) {
    const message = typeof body.message === "string" ? body.message : body.message.message;
    super(localizeApiMessage(message));
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.error = localizeApiMessage(body.error);
    this.details = body.details?.map((detail) => ({
      ...detail,
      message: Array.isArray(detail.message)
        ? detail.message.map(localizeApiMessage)
        : localizeApiMessage(detail.message),
    }));
    this.conflicts = typeof body.message === "object" ? body.message.conflicts : undefined;
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.statusCode === "number" &&
    (typeof record.message === "string" || (
      typeof record.message === "object" && record.message !== null &&
      typeof (record.message as Record<string, unknown>).message === "string"
    )) &&
    typeof record.error === "string"
  );
}
