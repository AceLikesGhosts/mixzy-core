/*


  __  __ _   _______             _    
 |  \/  (_) |__   __|           | |   
 | \  / |___  _| |_ __ __ _  ___| | __
 | |\/| | \ \/ / | '__/ _` |/ __| |/ /
 | |  | | |>  <| | | | (_| | (__|   < 
 |_|  |_|_/_/\_\_|_|  \__,_|\___|_|\_\
                                      
* Author: Jordan (LIFELINE) <hello@lifeline1337.dev>
* Copyright (C) 2023 LIFELINE
* Repo: https://github.com/lifeline1337/mixtrack-restful
* LICENSE: MIT <https://github.com/lifeline1337/mixtrack-restful/blob/main/LICENSE>
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

export interface ApiError extends Error {
  code: number,
  error: string,
  message: string
}