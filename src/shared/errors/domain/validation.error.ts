import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';

export class ValidationError extends AppError {
  constructor({
    key,
    field,
    value,
    metadata = {},
  }: {
    key: string;
    field?: string;
    value?: string;
    metadata: Partial<IAppErrorMetadata>;
  }) {
    super(400, 'VALIDATION_ERROR', key, ErrorSeverity.LOW, ErrorCategory.VALIDATION, {
      ...metadata,
      context: {
        field,
        value,
        ...metadata.context,
      },
    });
  }
}
