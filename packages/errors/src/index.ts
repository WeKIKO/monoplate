export class AppError extends Error {
  constructor(readonly code: string, message: string, readonly cause?: unknown) { super(message); this.name = "AppError"; }
}
