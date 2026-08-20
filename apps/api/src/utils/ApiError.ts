export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Record<string, string>;

  constructor(statusCode: number, message: string, code = "ERROR", errors?: Record<string, string>) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, errors?: Record<string, string>) {
    return new ApiError(400, message, "BAD_REQUEST", errors);
  }
  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHENTICATED");
  }
  static forbidden(message = "You do not have permission to do this") {
    return new ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static conflict(message: string) {
    return new ApiError(409, message, "CONFLICT");
  }
  static unprocessable(message: string, errors?: Record<string, string>) {
    return new ApiError(422, message, "VALIDATION_ERROR", errors);
  }
  static tooManyRequests(message = "Too many requests — please slow down") {
    return new ApiError(429, message, "RATE_LIMITED");
  }
  static internal(message = "Something went wrong. Please try again.") {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
  static serviceUnavailable(message: string) {
    return new ApiError(503, message, "SERVICE_UNAVAILABLE");
  }
}
