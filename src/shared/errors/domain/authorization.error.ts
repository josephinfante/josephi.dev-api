import { AppError } from '@error/app-error';
import { ErrorCategory, ErrorSeverity, type IAppErrorMetadata } from '@error/app-error.i';
import { APP_ERROR_KEYS } from '../app-error.keys';

export class AuthorizationError extends AppError {
  constructor({
    key = APP_ERROR_KEYS.AUTH_DENIED,
    requiredPermission,
    additionalMetadata = {},
  }: {
    key: string;
    requiredPermission?: string;
    additionalMetadata: Partial<IAppErrorMetadata>;
  }) {
    super(403, 'AUTHORIZATION_ERROR', key, ErrorSeverity.MEDIUM, ErrorCategory.AUTHORIZATION, {
      ...additionalMetadata,
      context: {
        requiredPermission,
        ...additionalMetadata.context,
      },
    });
  }
}
