import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';

export class EnvironmentError extends AppError {
  public override readonly isOperational = true;

  constructor(
    message: string,
    public readonly originalError?: Error,
    metadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(500, 'ENVIRONMENT_ERROR', message, ErrorSeverity.CRITICAL, ErrorCategory.ENVIRONMENT, {
      ...metadata,
      context: {
        originalError: originalError?.message,
        ...metadata.context,
      },
    });
  }
}
