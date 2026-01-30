import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';

export class DatabaseError extends AppError {
  constructor(
    message: string,
    public readonly operation?: string,
    public readonly originalError?: Error,
    metadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(500, 'DATABASE_ERROR', message, ErrorSeverity.HIGH, ErrorCategory.DATABASE, {
      ...metadata,
      context: {
        operation,
        originalError: originalError?.message,
        ...metadata.context,
      },
    });
  }
}
