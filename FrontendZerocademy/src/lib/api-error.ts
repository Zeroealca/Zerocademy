import { localizeApiMessage } from "@/lib/localize-api-message";

export interface ApiErrorDetail {
  field: string;
  message: string | string[];
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
  details?: ApiErrorDetail[];
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly error: string;
  readonly details?: ApiErrorDetail[];

  constructor(body: ApiErrorBody) {
    super(localizeApiMessage(body.message));
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.error = localizeApiMessage(body.error);
    this.details = body.details?.map((detail) => ({
      ...detail,
      message: Array.isArray(detail.message)
        ? detail.message.map(localizeApiMessage)
        : localizeApiMessage(detail.message),
    }));
  }
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.statusCode === "number" &&
    typeof record.message === "string" &&
    typeof record.error === "string"
  );
}
