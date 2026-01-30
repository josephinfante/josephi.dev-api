import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';

export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly originalError?: Error,
    metadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(
      502,
      'EXTERNAL_SERVICE_ERROR',
      message,
      ErrorSeverity.HIGH,
      ErrorCategory.EXTERNAL_SERVICE,
      {
        ...metadata,
        context: {
          service: serviceName,
          originalError: originalError?.message,
          ...metadata.context,
        },
      },
    );
  }
}
