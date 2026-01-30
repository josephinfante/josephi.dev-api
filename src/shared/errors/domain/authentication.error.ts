import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';
import { APP_ERROR_KEYS } from '../app-error.keys';

export class AuthenticationError extends AppError {
  constructor({
    key = APP_ERROR_KEYS.AUTH_FAILED,
    metadata = {},
  }: {
    key: string;
    metadata: Partial<IAppErrorMetadata>;
  }) {
    super(
      401,
      'AUTHENTICATION_ERROR',
      key,
      ErrorSeverity.MEDIUM,
      ErrorCategory.AUTHENTICATION,
      metadata,
    );
  }
}
