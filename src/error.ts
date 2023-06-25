export class NotFoundError extends Error {

  code = 404;

  error = "Not Found.";

}

export class ServerError extends Error {

  code = 500;

  error = "Server Error";

  message = "Internal Server Error.";

}

export class BadRequestError extends Error {

  code = 400;

  error = "Bad Request";

}

export class RateLimitError extends Error {

  code = 429;

  error = "Too Many Requests";

}

export class ForbiddenError extends Error {

  code = 403;

  error = "Forbidden";

  message = "Access Denied.";

}

export interface ApiError extends Error {
  code: number,
  error: string,
  message: string
}