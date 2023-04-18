/*
  __  __           _                      _ 
 |  \/  |         (_)                    | |
 | \  / |_   _ ___ _  ___ _ __   __ _  __| |
 | |\/| | | | / __| |/ __| '_ \ / _` |/ _` |
 | |  | | |_| \__ \ | (__| |_) | (_| | (_| |
 |_|  |_|\__,_|___/_|\___| .__/ \__,_|\__,_|
                         | |                
                         |_|                

* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/musicpadnet/musicpad-core
* LICENSE: MIT <https://github.com/musicpadnet/musicpad-core/blob/main/LICENSE>
*/

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