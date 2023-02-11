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

import joi from "joi";

// register validator
export const registerValidator = joi.object({
  email: joi.string().required().email().max(300),
  username: joi.string().required().min(3).max(45).regex(new RegExp("^(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._ ]+(?<![_.])$")),
  password: joi.string().required().min(7).max(300)
});

// login validator
export const loginValidator = joi.object({
  email: joi.string().required().email(),
  password: joi.string().required()
});

// refresh validator
export const refreshValidator = joi.object({
  refresh_token: joi.string().required()
});