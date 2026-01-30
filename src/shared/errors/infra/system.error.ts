import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '../app-error.i';

export class SystemError extends AppError {
  public override readonly isOperational = false;

  constructor(
    message: string,
    public readonly originalError?: Error,
    metadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(500, 'SYSTEM_ERROR', message, ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM, {
      ...metadata,
      context: {
        originalError: originalError?.message,
        ...metadata.context,
      },
    });
  }
}
