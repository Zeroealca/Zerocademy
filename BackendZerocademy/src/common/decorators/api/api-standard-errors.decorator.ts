import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/swagger';

/** Documents standard error responses for protected/mutating routes. */
export function ApiStandardErrorResponses(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    ApiBadRequestResponse({ type: ApiErrorResponseDto }),
    ApiUnauthorizedResponse({ type: ApiErrorResponseDto }),
    ApiForbiddenResponse({ type: ApiErrorResponseDto }),
    ApiNotFoundResponse({ type: ApiErrorResponseDto }),
    ApiConflictResponse({ type: ApiErrorResponseDto }),
  );
}
