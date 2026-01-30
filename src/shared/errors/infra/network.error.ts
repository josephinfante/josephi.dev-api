import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';

export class NetworkError extends AppError {
  constructor(
    message: string,
    public readonly originalError?: Error,
    metadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(503, 'NETWORK_ERROR', message, ErrorSeverity.HIGH, ErrorCategory.NETWORK, {
      ...metadata,
      context: {
        originalError: originalError?.message,
        ...metadata.context,
      },
    });
  }
}
