import { ErrorSeverity, type ErrorCategory, type IAppErrorMetadata } from '@error/app-error.i';

export abstract class AppError extends Error {
  public readonly timestamp: Date;
  public readonly isOperational: boolean = true;
  public readonly metadata: IAppErrorMetadata;

  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    key: string,
    public readonly severity: ErrorSeverity,
    public readonly category: ErrorCategory,
    additionalMetadata: Partial<IAppErrorMetadata> = {},
  ) {
    super(key);

    this.name = new.target.name;
    this.timestamp = new Date();

    Error.captureStackTrace(this, new.target);

    this.metadata = {
      ...additionalMetadata,
      timestamp: this.timestamp,
      stack: this.stack,
      correlationId: additionalMetadata.correlationId,
      userId: additionalMetadata.userId,
      context: additionalMetadata.context,
    };
  }

  public isCritical(): boolean {
    return this.severity === ErrorSeverity.CRITICAL || this.severity === ErrorSeverity.HIGH;
  }

  public shouldReport(): boolean {
    return this.isOperational && this.isCritical();
  }
}
