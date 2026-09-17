import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../logger/app-logger.service';

interface ValidationErrorResponse {
  message: string | string[];
  error?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const body = this.normalizeErrorBody(status, exceptionResponse);

    if (status >= 500) {
      const err =
        exception instanceof Error
          ? exception
          : new Error(typeof exception === 'string' ? exception : 'Unknown error');

      this.logger.error({
        context: 'HttpExceptionFilter',
        event: 'UNEXPECTED_ERROR',
        message: err.message || body.message,
        stack: err.stack,
        metadata: {
          path: request.url,
          method: request.method,
          statusCode: status,
          errorName: err.name,
          exceptionType:
            exception instanceof HttpException
              ? 'HttpException'
              : exception instanceof Error
                ? exception.constructor.name
                : typeof exception,
        },
      });
    } else if (status === HttpStatus.UNAUTHORIZED) {
      this.logger.warn({
        context: 'HttpExceptionFilter',
        event: 'UNAUTHORIZED',
        message: body.message,
        metadata: {
          path: request.url,
          method: request.method,
          statusCode: status,
        },
      });
    }

    response.status(status).json(body);
  }

  private normalizeErrorBody(
    statusCode: number,
    exceptionResponse: string | object,
  ): {
    statusCode: number;
    message: string;
    error: string;
    details?: { field: string; message: string | string[] }[];
  } {
    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        message: exceptionResponse,
        error: HttpStatus[statusCode] ?? 'Error',
      };
    }

    const payload = exceptionResponse as ValidationErrorResponse & {
      statusCode?: number;
      details?: { field: string; message: string | string[] }[];
    };

    const message = Array.isArray(payload.message)
      ? 'Validation failed'
      : payload.message;

    const details = Array.isArray(payload.message)
      ? payload.message.map((item) => {
          const [field, ...rest] = item.split(' ');
          return {
            field: field ?? 'unknown',
            message: rest.join(' ') || item,
          };
        })
      : payload.details;

    return {
      statusCode,
      message,
      error: payload.error ?? HttpStatus[statusCode] ?? 'Error',
      ...(details ? { details } : {}),
    };
  }
}
