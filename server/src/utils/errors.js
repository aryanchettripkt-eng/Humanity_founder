export class AppError extends Error {
  /**
   * @param {number} status
   * @param {string} code
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details, code = 'BAD_REQUEST') =>
  new AppError(400, code, message, details);

export const unauthorized = (message = 'Authentication required', code = 'UNAUTHORIZED') =>
  new AppError(401, code, message);

export const forbidden = (message = 'Access denied', code = 'FORBIDDEN') =>
  new AppError(403, code, message);

export const notFound = (message = 'Resource not found', code = 'NOT_FOUND') =>
  new AppError(404, code, message);

